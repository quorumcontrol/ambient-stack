import * as Automerge from 'automerge'
import { Community } from 'tupelo-wasm-sdk'
import { EventEmitter } from 'events'
import { getAppCommunity } from './community'


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
            console.log("msg: ", msg, "data: ", Buffer.from(msg.data).toString())
            let changes = JSON.parse(Buffer.from(msg.data).toString())
            this.state = Automerge.applyChanges(this.state, changes)
            this.emit('update', changes)
        })
        console.log("subscribed")
    }

    private async publishChanges(changes:Automerge.Change[]) {
        this.emit('update', changes)
        const c = await Community.getDefault()
        console.log("publishing: ", this.name)
        c.node.pubsub.publish(this.name, JSON.stringify(changes)).catch((err:Error)=> {
            console.error("error publishing: ", err)
        })
    }
}