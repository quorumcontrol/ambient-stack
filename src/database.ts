import * as Automerge from 'automerge'
import { Community, EcdsaKey, ChainTree, setOwnershipTransaction, setDataTransaction } from 'tupelo-wasm-sdk'
import { EventEmitter } from 'events'
import { getAppCommunity } from './community'

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

interface InitialDoc {
    type: MessageType.initial
    initial: any
}



export type Reducer<S,A> = (state:S, action:A) => void

export class DecentralizedDatabase<S,A> extends EventEmitter  {

    state: Automerge.FreezeObject<S>
    reducer:Reducer<S,A>
    name:string
    started:boolean
    userTree?:ChainTree

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
    }

    async did():Promise<string> {
        const key = await EcdsaKey.passPhraseKey(Buffer.from(this.name), namespace)
        return await key.toDid()
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
        for (let did in dids) {
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
    }

    start(userTree:ChainTree) {
        if (this.started) {
            this.userTree = userTree
            this.started = true
            return this.listen()
        }
        return Promise.resolve()
    }

    private async getInitialState() {
        const did = await this.did()
        const tip = await c.getTip(did)

        const tree = new ChainTree({
            store: c.blockservice,
            tip: tip,
        })

        const resp = await tree.resolve("/writers")
        const writers = resp.value as {[key: string]:number}

        // go through each writer and get their latest state and sync it to the automerge doc
    }

    private async listen() {
        console.log("awaiting community")
        const c = await this.community
        console.log("subscribing to ", this.name)

      

        await c.node.pubsub.subscribe(await this.did(), (msg:any) => {
            let decoded = dagCBOR.util.deserialize(Buffer.from(msg.data))
            console.log("msg: ", msg, "decoded: ", decoded)

            switch (decoded.type) {
                case MessageType.change:
                    console.log("applying change")
                    this.state = Automerge.applyChanges(this.state, decoded.updates)
                    break
                // case MessageType.initial:
                //     const otherDoc = Automerge.load(decoded.initial)

                //     const newDoc = Automerge.merge(this.state, otherDoc) as Automerge.FreezeObject<S>
                //     const changes = Automerge.getChanges(this.state, newDoc)

                //     this.state = newDoc

                //     c.node.pubsub.publish(this.name, dagCBOR.util.serialize({
                //         type: MessageType.change,
                //         updates: changes,
                //     })).catch((err:Error)=> {
                //         console.error("error publishing: ", err)
                //     })

                //     break
                default:
                    console.error("unknown messsage type: ", decoded.type)

            }
            this.emit('update', decoded.updates)
        })

        const topicMonitor = new PeerMonitor(c.node.pubsub, this.name)
        topicMonitor.on('join', (peer:any)=> {
            console.log("peer joined: ", peer)
            // const currentState = Automerge.save(this.state)
            // const doc = {
            //     type: MessageType.initial,
            //     initial: currentState,
            // } as InitialDoc

            // c.node.pubsub.publish(this.name, dagCBOR.util.serialize(doc)).catch((err:Error)=> {
            //     console.error("error publishing: ", err)
            // })
        })

      
        console.log("subscribed")
        return
    }

    private async publishChanges(changes:Automerge.Change[]) {
        const c = await getAppCommunity()
        const did = await this.did()
        this.emit('update', changes)
        console.log("publishing: ", did)

        const doc = {
            type: MessageType.change,
            updates: changes,
        } as ChangeDoc

        // TODO: save this change to a writer chaintree

        c.node.pubsub.publish(did, dagCBOR.util.serialize(doc)).catch((err:Error)=> {
            console.error("error publishing: ", err)
        })
    }
}