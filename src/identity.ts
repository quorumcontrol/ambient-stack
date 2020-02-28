import { debug } from "debug";
import { ChainTree, EcdsaKey, setDataTransaction, setOwnershipTransaction, Tupelo, Community } from "tupelo-wasm-sdk";
import { EventEmitter } from "events";

const log = debug("identity")

/**
 * The path within the user ChainTree where decentratweet stores the username
 */
export const usernamePath = "tupelo.me/username"

/**
 * Generates a public/private keypair from an *insecure* passphrase (username).
 * The generated ChainTree will have a known name derived from the username
 * argument. The very first thing you do with the ChainTree should be to
 * ChangeOwner 
 * @param username - the username
 * @param userNamespace - a namespace to drop the users into (a user is globally unique to their username/userNamespace combination eg: tobowers/clownfahrt.de is different than tobowers/differentNamespace.whatever)
 */
const insecureUsernameKey = async (username: string, userNamespace:Uint8Array) => {
    return EcdsaKey.passPhraseKey(Buffer.from(username), userNamespace)
}

/**
 * Convert a username-password pair into a secure ecdsa key pair for owning
 * arbitrary chaintrees.
 */
const securePasswordKey = async (username: string, password: string) => {
    return EcdsaKey.passPhraseKey(Buffer.from(password), Buffer.from(username))
}

/**
 * When given a public-private key pair, returns the did of a chaintree created
 * by that pairing
 */
const didFromKey = async (key: EcdsaKey) => {
    return await Tupelo.ecdsaPubkeyToDid(key.publicKey)
}

/**
 * Looks up the user account chaintree for the given username, returning it if
 * it exists.
 */
export const findUserAccount = async (username: string, userNamespace:Uint8Array) => {
    const c = await Community.getDefault()
    const insecureKey = await insecureUsernameKey(username, userNamespace)
    const did = await didFromKey(insecureKey)

    let tip
    let tree: ChainTree | undefined = undefined

    try {
        tip = await c.getTip(did)
    } catch (e) {
        if (e === "not found") {
            // do nothing, let tip be null
        }
    }

    if (tip !== undefined) {
        tree = new ChainTree({
            store: c.blockservice,
            tip: tip,
        })
    }

    return tree
};

/**
 * Verifies that the secure password key generated with the provided username
 * and password matches one of the owner keys for the provided chaintree.
 */
export const verifyAccount = async (username: string, password: string, userTree: ChainTree): Promise<[boolean, User?]> => {
    let secureKey = await securePasswordKey(username, password)
    let secureAddr = await secureKey.address()
    let resolveResp = await userTree.resolve("tree/_tupelo/authentications")
    let auths: string[] = resolveResp.value
    if (auths.includes(secureAddr)) {
        userTree.key = secureKey

        return [true, new User(username, userTree, await Community.getDefault())]
    } else {
        return [false, undefined]
    }
}

export const fromDidAndKeyString = async (did: string, keyString: string) => {
    try {
        const c = await Community.getDefault()
        let tip
        tip = await c.getTip(did)

        const key = await EcdsaKey.fromBytes(Buffer.from(keyString, 'base64'))

        const tree = new ChainTree({
            key: key,
            tip: tip,
            store: c.blockservice,
        })

        const username = (await tree.resolveData(usernamePath)).value
        
        const user = new User(username, tree, c)
        return user
    } catch (e) {
        throw e
    }
}

/**
 * Registers a username-password pair by creating a new account chaintree
 * corresponding to the username, and transferring ownership to the secure key
 * pair corresponding to the username-password pair.
 *
 * Returns a handle for the created * chaintree
 */
export const register = async (username: string, password: string, userNamespace:Uint8Array) => {
    log("register")
    const c = await Community.getDefault()
    log('creating key')
    const insecureKey = await insecureUsernameKey(username, userNamespace)
    const secureKey = await securePasswordKey(username, password)
    const secureKeyAddress = await secureKey.address()

    log("creating user chaintree")
    const userTree = await ChainTree.newEmptyTree(c.blockservice, insecureKey)

    log("transferring ownership of user chaintree and registering tweet feed")
    await c.playTransactions(userTree, [
        // Set the ownership of the user chaintree to our secure key (thus
        // owning the username)
        setOwnershipTransaction([secureKeyAddress]),

        // Cache the username inside of the chaintree for easier access later
        setDataTransaction(usernamePath, username),
    ])

    userTree.key = secureKey

    const user = new User(username, userTree, c)

    return user
}

/**
 * Find the username from the given user account ChainTree
 */
export const resolveUsername = async (tree: ChainTree) => {
    log("fetching username")
    const usernameResp = await tree.resolveData(usernamePath)
    if (usernameResp.remainderPath.length && usernameResp.remainderPath.length > 0) {
        return ""
    } else {
        return usernameResp.value
    }
}

export class User extends EventEmitter {
    tree: ChainTree
    did?:string
    community: Community
    userName: string

    //TODO: error handling
    static async find(userName: string, userNamespace:Uint8Array, community: Community) {
        const tree = await findUserAccount(userName, userNamespace)
        if (!tree) {
            throw new Error("no tree found")
        }
        return new User(userName, tree, community)
    }

    constructor(userName: string, tree: ChainTree, community: Community) {
        super()
        this.tree = tree
        this.community = community
        this.userName = userName
    }

    async load() {
        await this.setDid()
        return this
    }

    private async setDid():Promise<string> {
        const did = await this.tree.id()
        if (did === null) {
            throw new Error("invalid did")
        }
        this.did = did
        return did
    }
}

