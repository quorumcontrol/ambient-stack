import * as Automerge from 'automerge'
import { Community, EcdsaKey, ChainTree, setOwnershipTransaction, setDataTransaction } from 'tupelo-wasm-sdk'
import { EventEmitter } from 'events'
import { getAppCommunity } from './community'
import debug from 'debug'

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

export type Reducer<S,A> = (state:S, action:A) => void

export class Database<S,A> extends EventEmitter  {

    state: Automerge.FreezeObject<S>
    reducer:Reducer<S,A>
    name:string
    started:boolean
    peerCount: number
    userTree?:ChainTree

    private _did?:Promise<string>

    private community:Promise<Community>

    constructor(name:string, reducer:Reducer<S,A>, initialState?:S) {
        super()

        this.name = name
        const doc = Automerge.init<S>() 
        if (doc === undefined) {
            throw new Error("undefined doc")
        }
        this.state = doc
        this.reducer = reducer
        this.started = false
        this.community = getAppCommunity()
        this.peerCount = 0
    }

    async did():Promise<string> {
        if (this._did) {
            return this._did
        }
        this._did = new Promise(async (resolve) => {
            const key = await EcdsaKey.passPhraseKey(Buffer.from(this.name), namespace)
            resolve(key.toDid())
        })

        return this._did

       
    }

    async create(adminKey:EcdsaKey) {
        const c = await this.community
        const key = await EcdsaKey.passPhraseKey(Buffer.from(this.name), namespace)
        const tree = await ChainTree.newEmptyTree(c.blockservice, key)

        const adminAddress = await adminKey.address()
        return c.playTransactions(tree, [setOwnershipTransaction([adminAddress])])
    }

    async allowWriters(adminKey:EcdsaKey, dids:string[]) {
        const c = await this.community
        const did = await this.did()
        const tip = await c.getTip(did)

        const tree = new ChainTree({
            store: c.blockservice,
            tip: tip,
            key: adminKey,
        })

        let txns = []
        for (let did of dids) {
            txns.push(setDataTransaction("/writers/" + did, new Date().getTime()))
        }

        return c.playTransactions(tree, txns)
    }

    dispatch(action:A) {
        if (!this.started) {
            throw new Error("database must be started to dispatch")
        }
        if (!this.userTree) {
            throw new Error("you cannot write to a decentralized db without a userTree")
        }
        const oldDoc = this.state
        this.state = Automerge.change(this.state, (state:S)=> {
            this.reducer(state, action)
        })

        const changes = Automerge.getChanges(oldDoc, this.state)
        this.publishChanges(changes)
        this.updateChainTree(changes)        
    }

    start(userTree:ChainTree) {
        if (!this.started) {
            this.userTree = userTree
            this.started = true
            return this.listen()
        }
        return Promise.resolve()
    }

    private async getInitialState() {
        log("getting initial state")
        const c = await this.community

        const dbDid = await this.did()
        const dbTip = await c.getTip(dbDid)

        const dbTree = new ChainTree({
            store: c.blockservice,
            tip: dbTip,
        })


        // go through each writer and get their latest state and sync it to the automerge doc

        const resp = await dbTree.resolveData("/writers")
        log("writers resp: ", resp)
        const writers= resp.value
        log("writers: ", writers)
        for (let did of Object.keys(writers)) {
            log("getting tip for writer: ", did)
            let tip
            try {
                tip = await c.getTip(did)
            } catch(e) {
                log(e)
                if (e.toString() !== "error getting tip: not found") {
                    console.error(e)
                }
                continue
            }
            const writerTree = new ChainTree({
                store: c.blockservice,
                tip: tip,
            })
            log("getting writer: ", did)
            const resp = await writerTree.resolveData(dbDid + "/latest")
            const latest = Automerge.load(resp.value)
            const newDoc = Automerge.merge(this.state, latest) as Automerge.FreezeObject<S>
            this.state = newDoc
        }
        this.emit('initialSync')
        log("initial sync finished")
    }

    private async listen() {
        log("awaiting community")
        const c = await this.community
        const did = await this.did()

        this.getInitialState()

        log("subscribing to ", did)

        await c.node.pubsub.subscribe(did, (msg:any) => {
            let decoded = dagCBOR.util.deserialize(Buffer.from(msg.data))
            log("msg: ", msg, "decoded: ", decoded)

            switch (decoded.type) {
                case MessageType.change:
                    log("applying change")
                    this.state = Automerge.applyChanges(this.state, decoded.updates)
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
        
        topicMonitor.on('join', (peer:any)=> {
            log("peer joined: ", peer)
            this.peerCount++
        })

        topicMonitor.on('leave', (peer:any)=> {
            log("peer left: ", peer)
            this.peerCount--
        })

    }

    // TODO: this needs to be serialized and done one at a time
    // and it should only happen every few seconds not on every change
    // also consider storing the actual changes outside of the chaintree - maybe sia?
    private async updateChainTree(changes:Automerge.Change[]) {
        if (!this.userTree) {
            throw new Error("you cannot update a userTree without a userTree")
        }

        const c = await getAppCommunity()
        const did = await this.did()

        const currentState = Automerge.save(this.state)

        await c.playTransactions(this.userTree, [setDataTransaction(did + "/latest", currentState)])
        log("chaintree updated")
        this.emit('sync', changes)
    }

    private async publishChanges(changes:Automerge.Change[]) {
        const c = await getAppCommunity()
        const did = await this.did()
        this.emit('update', changes)
        log("publishing: ", did)

        const doc = {
            type: MessageType.change,
            updates: changes,
        } as ChangeDoc

        c.node.pubsub.publish(did, dagCBOR.util.serialize(doc)).catch((err:Error)=> {
            console.error("error publishing: ", err)
        })
    }
}