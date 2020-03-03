import React, { useState, useEffect } from 'react'
import { User, getAppCommunity, verifyAccount, register, Database} from 'ambient-stack';
import { EcdsaKey, Repo } from 'tupelo-wasm-sdk';
import debug from 'debug';

import woman from '../images/woman.jpg'
import man from '../images/man.jpg'
import carol from '../images/carol.jpg'
import { User as UserIcon } from 'grommet-icons';
import { Image } from 'grommet';

import { UserTeamsState, UserTeamsReducer, UserTeamsStateUpdateEvt} from './teamdb';

const log = debug("util.user")

export const userNamespace = Buffer.from('demo-only-async-daily-standups')
const Key = require("interface-datastore").Key

interface AmbientUserReturn {
    loading: boolean
    user?: User
}

export function getIcon(name: string): JSX.Element {
    let userIcon
    if (name === undefined) {
        name = ""
    }
    switch (name.toLowerCase()) {
        case 'alice':
            userIcon = <Image fit="contain" src={woman} />;
            break;
        case 'bob':
            userIcon = <Image fit="contain" src={man} />;
            break;
        case 'carol':
            userIcon = <Image fit="contain" src={carol} />;
            break;
        default:
            userIcon = <UserIcon size="120px" />
    }
    return userIcon
}

export async function login(username:string,password:string,repo:Repo):Promise<[boolean,User?]> {
    const [found,user] = await verifyAccount(username, password, userNamespace)
    if (found) {
        await repo.put(usernameKey, Buffer.from(username))
        //TODO: need to more securely store the private key here
        await repo.put(privateKeyKey, user?.tree.key?.privateKey!)
        return [true, user]
    }
    return [false,undefined]
}

export async function signup(username:string,password:string,repo:Repo):Promise<User> {
    log('registering user')
    const user = await register(username,password,userNamespace)
    await repo.put(usernameKey, Buffer.from(username))
    //TODO: need to more securely store the private key here
    await repo.put(privateKeyKey, user.tree.key?.privateKey!)

    log('setting up teams database')
    // setup their app database
    const db = new Database<UserTeamsState,UserTeamsStateUpdateEvt>(username + "-app-settings", UserTeamsReducer, {teams:[]})
    await db.create(user.tree.key!)

    const did = await user.tree.id()
    log('allowing writers')
    await db.allowWriters(user.tree.key!, [did!])
    log('done')
    return user
}


interface repoState {
    loading: boolean
    repo?: Repo
}

let repos:{
    [key:string]:Promise<Repo>
} = {}

export function useUserRepo():repoState {
    return useRepo("ambientUser")
}

export function useRepo(repoName: string, opts?: any): repoState {
    const [state, setState] = useState({ loading: true } as repoState)

    useEffect(() => {
        let repoPromise = repos[repoName]
        if (!repoPromise) {
            repoPromise = new Promise(async (resolve)=> {
                const repo = new Repo(repoName, opts)
                await repo.init({})
                await repo.open()
                resolve(repo)
            })
            repos[repoName] = repoPromise
        }
        const waitForRepo = async () => {
            let repo = await repoPromise
            setState({ loading: false, repo: repo })
        }
        waitForRepo()
    }, [repoName, opts])

    return state
}

const usernameKey = new Key("username")
const privateKeyKey = new Key("privateKey")

export async function logout(repo:Repo) {
    await repo.delete(usernameKey)
    await repo.delete(privateKeyKey)
    appUser = {user:undefined, userPromise:undefined}
}

let appUser:{user:User|undefined, userPromise:Promise<User>|undefined} = {user:undefined, userPromise:undefined}

export function useAmbientUser(): AmbientUserReturn {
    const [state, setState] = useState({ loading: !(appUser.user), user: appUser.user} as AmbientUserReturn)

    const {repo} = useUserRepo()

    useEffect(() => {
        const awaitUser = async ()=> {
            let user = await appUser.userPromise
            appUser.user = user
            // user can be undefined here when not found
            setState({
                loading: false,
                user: user,
            })
        }

        if (repo) {
            if (!appUser.userPromise) {
                appUser = {
                    user: undefined,
                    userPromise: new Promise(async (resolve)=> {
                        if (!repo) {
                            throw new Error("must have a repo to use (error should never happen)")
                        }
            
                        log("fetching user")
                        let username:string
                        try {
                            username = await repo.get(usernameKey)
                        } catch(e) {
                            if (e.code === "ERR_NOT_FOUND") {
                                resolve(undefined)
                                return // no user
                            }
                            throw e
                        }
            
                        const privateKey = await repo.get(privateKeyKey)
            
                        const c = await getAppCommunity()
                        const key = await EcdsaKey.fromBytes(privateKey)
                        let user
                        try {
                            user = await User.find(username.toString(), userNamespace, c)
                        } catch(e) {
                            if (e.message === "no tree found") {
                                await logout(repo)
                                resolve(undefined)
                                return // no user
                            }
                            throw e
                        }
                        user.tree.key = key
                        await user.load()
                        resolve(user)
                    })
                }
                awaitUser()
            }
          
        }
    }, [repo,])

    return state
}