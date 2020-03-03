import * as Automerge from 'automerge'
import { Tupelo, Community, EcdsaKey, ChainTree, setOwnershipTransaction, setDataTransaction } from 'tupelo-wasm-sdk'
import { EventEmitter } from 'events'
import { getAppCommunity } from './community'
import debug from 'debug'
import { SimpleSyncher } from './simplesyncher'

const log = debug('database')

const dagCBOR = require('ipld-dag-cbor')
const PeerMonitor = require('ipfs-pubsub-peer-monitor')

const namespace = Buffer.from("ambient-demo-dbs")

enum MessageType {
    change,
    initial
}

interface ChangeDoc {
    type: MessageType.change
    updates: any
}

interface createOpts<S> {
    writers?: string[],
    initialState?: S
}

export type Reducer<S, A> = (state: S, action: A) => void

function transactionsForWriters(writerDids: string[]) {
    let txns = []
    for (const did of writerDids) {
        txns.push(setDataTransaction("/writers/" + did, new Date().getTime()))
    }
    return txns
}

export class Database<S, A> extends EventEmitter {

    private _state?: Automerge.FreezeObject<S>
    reducer: Reducer<S, A>
    name: string
    started: boolean
    peerCount: number
    userTree?: ChainTree
    initiallyLoaded: boolean
    fullyLoaded: boolean

    private _did?: Promise<string>
    private community: Promise<Community>
    private syncher: SimpleSyncher
    private dbTree?: ChainTree

    constructor(name: string, reducer: Reducer<S, A>) {
        super()

        this.name = name
        this.reducer = reducer
        this.started = false
        this.community = getAppCommunity()
        this.peerCount = 0
        this.initiallyLoaded = false
        this.fullyLoaded = false

        this.syncher = new SimpleSyncher("chaintree-updates", { onlyOne: true })
    }

    did(): Promise<string> {
        if (this._did) {
            return this._did
        }
        this._did = new Promise(async (resolve) => {
            const key = await EcdsaKey.passPhraseKey(Buffer.from(this.name), namespace)
            resolve(key.toDid())
        })

        return this._did
    }

    get state() {
        return this._state!
    }

    async create(adminKey: EcdsaKey, opts?: createOpts<S>) {
        const c = await this.community
        const key = await EcdsaKey.passPhraseKey(Buffer.from(this.name), namespace)
        const tree = await ChainTree.newEmptyTree(c.blockservice, key)

        const adminAddress = await adminKey.address()

        this.dbTree = tree
        let txs = [setOwnershipTransaction([adminAddress])]
        if (opts && opts.writers) {
            txs = txs.concat(transactionsForWriters(opts.writers))
        }

        let doc:Automerge.FreezeObject<S>
        if (opts && opts.initialState) {
            doc = Automerge.from(opts.initialState, (await tree.id())!)
        } else {
            doc = Automerge.from({} as S, (await tree.id())!)
        }
        const currentState = Automerge.save(doc)
        txs.push(setDataTransaction("/latest", currentState))

        return c.playTransactions(tree, txs)
    }

    async allowWriters(adminKey: EcdsaKey, dids: string[]) {
        const c = await this.community

        if (!this.dbTree) {
            await this.fetchDbTree()
        }
        if (!this.dbTree) {
            throw new Error("no db tree after fetch")
        }
        this.dbTree.key = adminKey

        return c.playTransactions(this.dbTree, transactionsForWriters(dids))
    }

    async writerList() {
        if (!this.dbTree) {
            await this.fetchDbTree()
        }
        if (!this.dbTree) {
            throw new Error("no db tree after fetch")
        }

        const resp = await this.dbTree.resolveData("/writers")
        return Object.keys(resp.value)
    }

    async isWriter(did:string) {
        const list = await this.writerList()
        for (const writerDid of list) {
            if (writerDid == did) {
                return true
            }
        }
        return false
    }

    /**
     * exists checks to see if this database has already been created
     */
    async exists() {
        const did = await this.did()
        try {
            const latest = await Tupelo.getTip(did)
            if (latest) {
                return true
            }
        } catch (e) {
            if (e.message.includes("not found")) {
                return false
            }
            throw e
        }

        return false
    }

    dispatch(action: A) {
        if (!this.started) {
            throw new Error("database must be started to dispatch")
        }
        if (!this.userTree) {
            throw new Error("you cannot write to a decentralized db without a userTree")
        }
        if (!this._state) {
            throw new Error("you must have a state to dispatch")
        }
        const oldDoc = this._state
        this._state = Automerge.change(this._state, (state: S) => {
            this.reducer(state, action)
        })

        const changes = Automerge.getChanges(oldDoc, this._state)
        this.publishChanges(changes)
        this.updateChainTree(changes)
    }

    start(userTree: ChainTree) {
        if (!this.started) {
            this.started = true

            return new Promise(async (resolve) => {
                this.userTree = userTree
                resolve(this.listen())
            })
        }
        return Promise.resolve()
    }

    // private initializeState(actorID?: string) {
    //     let doc: Automerge.FreezeObject<S>
    //     if (this.initialState) {
    //         doc = Automerge.from(this.initialState, actorID)
    //     } else {
    //         doc = Automerge.init<S>(actorID)
    //     }
    //     if (doc === undefined) {
    //         throw new Error("undefined doc")
    //     }
    //     this._state = doc
    // }

    private async fetchDbTree() {
        const c = await this.community
        const dbDid = await this.did()
        const dbTip = await c.getTip(dbDid)

        log("getting dbTree")
        const dbTree = new ChainTree({
            store: c.blockservice,
            tip: dbTip,
        })
        this.dbTree = dbTree
        return dbTree
    }

    private async getInitialState() {
        if (!this.userTree) {
            throw new Error("you must have a userTree")
        }

        const dbDid = await this.did()
        const userDid = await this.userTree.id()
        const dbTree = await this.fetchDbTree()

        const dbInitial = await dbTree.resolveData("/latest")
        this._state = Automerge.load(dbInitial.value, dbDid)

        // start with the users tree because it is most likely local
        const userStateResp = await this.userTree.resolveData(dbDid + "/latest")
        if (userStateResp.value) {
            this.mergeWriterState(userStateResp.value, userDid!)
        }
        this.initiallyLoaded = true
        this.emit('initialLocalSync')

        // go through each writer (that is not user) and get their latest state and sync it to the automerge doc
        const resp = await dbTree.resolveData("/writers")
        log("writers resp: ", resp)
        const writers = resp.value
        log("writers: ", writers)
        if (!writers || writers.length === 0) {
            this.fullyLoaded = true
            this.emit('initialSync')
            return
        }

        // only merge in *other* writers (not the user)
        const promises = Object.keys(writers).filter((did) => { return did != userDid }).map(async (did) => {
            log("getting tip for writer: ", did)
            return this.mergeWriterState((await this.getWriterState(did, dbDid)), did)
        })

        await Promise.all(promises)
        this.fullyLoaded = true
        this.emit('initialSync')
        log("initial sync finished")
    }

    private async getWriterState(writerDid: string, dbDid: string) {
        const c = await this.community
        let tip
        try {
            tip = await c.getTip(writerDid)
        } catch (e) {
            // log(e)
            // console.log("e: ", e.name, "msg: ", e.message)
            if (!e.toString().includes("not found")) {
                console.error("tip error: ", e)
            }
            return
        }
        const writerTree = new ChainTree({
            store: c.blockservice,
            tip: tip,
        })
        log("getting writer: ", writerDid)
        const resp = await writerTree.resolveData(dbDid + "/latest")
        return resp.value // can be undefined
    }

    private mergeWriterState(state:string, writerDid: string) {
        if (!this._state) {
            throw new Error("you must have an initial state")
        }

        if (state) {
            const latest = Automerge.load(state, writerDid)
            const newDoc = Automerge.merge(this._state, latest) as Automerge.FreezeObject<S>
            this._state = newDoc
        }
    }

    private async listen() {
        log("awaiting community")
        const c = await this.community
        const did = await this.did()

        this.getInitialState()

        log("subscribing to ", did)

        await c.node.pubsub.subscribe(did, (msg: any) => {
            if (!this._state) {
                throw new Error("you must have a state to apply changes to")
            }
            let decoded = dagCBOR.util.deserialize(Buffer.from(msg.data))
            log("msg: ", msg, "decoded: ", decoded)

            switch (decoded.type) {
                case MessageType.change:
                    log("applying change")
                    this._state = Automerge.applyChanges(this._state, decoded.updates)
                    break
                default:
                    console.error("unknown messsage type: ", decoded.type)

            }
            this.emit('update', decoded.updates)
        })

        this.setupPeerMonitor()
        log("subscribed")
        return
    }

    private async setupPeerMonitor() {
        const c = await this.community
        const did = await this.did()

        const topicMonitor = new PeerMonitor(c.node.pubsub, did)
        let peers = await topicMonitor.getPeers()
        this.peerCount = peers.length

        topicMonitor.on('join', (peer: any) => {
            log("peer joined: ", peer)
            this.peerCount++
        })

        topicMonitor.on('leave', (peer: any) => {
            log("peer left: ", peer)
            this.peerCount--
        })

    }

    // TODO: this needs to be serialized and done one at a time
    // and it should only happen every few seconds not on every change
    // also consider storing the actual changes outside of the chaintree - maybe sia?
    private updateChainTree(changes: Automerge.Change[]) {
        this.syncher.send(async () => {
            if (!this.userTree) {
                throw new Error("you cannot update a userTree without a userTree")
            }
            if (!this._state) {
                throw new Error("you must have a state")
            }

            const c = await getAppCommunity()
            const did = await this.did()

            const currentState = Automerge.save(this._state)

            await c.playTransactions(this.userTree, [setDataTransaction(did + "/latest", currentState)])
            log("chaintree updated")
            this.emit('sync', changes)
        })

    }

    private async publishChanges(changes: Automerge.Change[]) {
        const c = await getAppCommunity()
        const did = await this.did()
        this.emit('update', changes)
        log("publishing: ", did)

        const doc = {
            type: MessageType.change,
            updates: changes,
        } as ChangeDoc

        c.node.pubsub.publish(did, dagCBOR.util.serialize(doc)).catch((err: Error) => {
            console.error("error publishing: ", err)
        })
    }
}