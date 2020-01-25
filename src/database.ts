import * as Automerge from 'automerge'
import { Community } from 'tupelo-wasm-sdk'
import { EventEmitter } from 'events'
import { getAppCommunity } from './community'

const dagCBOR = require('ipld-dag-cbor')
const PeerMonitor = require('ipfs-pubsub-peer-monitor')


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

    constructor(name:string, reducer:Reducer<S,A>, initialState?:S) {
        super()

        this.name = name
        const doc = Automerge.init<S>() 
        if (doc === undefined) {
            throw new Error("undefined doc")
        }
        this.state = doc
        this.reducer = reducer
        this.listen()
    }

    dispatch(action:A) {
        const oldDoc = this.state
        this.state = Automerge.change(this.state, (state:S)=> {
            this.reducer(state, action)
        })

        const changes = Automerge.getChanges(oldDoc, this.state)
        this.publishChanges(changes)
    }

    private async listen() {
        console.log("awaiting community")
        const c = await getAppCommunity()
        console.log("subscribing to ", this.name)
        await c.node.pubsub.subscribe(this.name, (msg:any) => {
            let decoded = dagCBOR.util.deserialize(Buffer.from(msg.data))
            console.log("msg: ", msg, "decoded: ", decoded)

            switch (decoded.type) {
                case MessageType.change:
                    console.log("applying change")
                    this.state = Automerge.applyChanges(this.state, decoded.updates)
                    break
                case MessageType.initial:
                    const otherDoc = Automerge.load(decoded.initial)

                    const newDoc = Automerge.merge(this.state, otherDoc) as Automerge.FreezeObject<S>
                    const changes = Automerge.getChanges(this.state, newDoc)

                    this.state = newDoc

                    c.node.pubsub.publish(this.name, dagCBOR.util.serialize({
                        type: MessageType.change,
                        updates: changes,
                    })).catch((err:Error)=> {
                        console.error("error publishing: ", err)
                    })

                    break
                default:
                    console.error("unknown messsage type: ", decoded.type)

            }
            this.emit('update', decoded.updates)
        })

        const topicMonitor = new PeerMonitor(c.node.pubsub, this.name)
        topicMonitor.on('join', (peer:any)=> {
            console.log("peer joined: ", peer)
            const currentState = Automerge.save(this.state)
            const doc = {
                type: MessageType.initial,
                initial: currentState,
            } as InitialDoc

            c.node.pubsub.publish(this.name, dagCBOR.util.serialize(doc)).catch((err:Error)=> {
                console.error("error publishing: ", err)
            })
        })

      
        console.log("subscribed")
    }

    private async publishChanges(changes:Automerge.Change[]) {
        const c = await getAppCommunity()
        this.emit('update', changes)
        console.log("publishing: ", this.name)

        const doc = {
            type: MessageType.change,
            updates: changes,
        } as ChangeDoc

        c.node.pubsub.publish(this.name, dagCBOR.util.serialize(doc)).catch((err:Error)=> {
            console.error("error publishing: ", err)
        })
    }
}