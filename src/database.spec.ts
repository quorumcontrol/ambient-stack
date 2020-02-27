import 'mocha'
import {expect} from 'chai'

import * as Automerge from 'automerge'

import {Database} from './database'
import { ChainTree, EcdsaKey } from 'tupelo-wasm-sdk'
import { getAppCommunity } from './community'

import crypto from 'crypto'


async function newTree():Promise<ChainTree> {
    const c = await getAppCommunity()
    const key = await EcdsaKey.generate()
    return ChainTree.newEmptyTree(c.blockservice, key)
}

describe("database", ()=> {

    it("works end-to-end", async ()=> {
        return new Promise(async (resolve)=> {
            interface appState {
                msg: string
            }
    
            interface appEvent {
                msg: string
            }
    
            const reducer = (state:appState,evt:appEvent)=> {
                state.msg = evt.msg
            }
    
            const alice = await newTree()
            const aliceDid = await alice.id()
            const bob = await newTree()
            const bobDid = await bob.id()
    
            // alice is the admin -- she creates the db - using a random name for now so tests don't conflict
    
            var name = crypto.randomBytes(20).toString('hex');
    
            const dbForCreate = new Database(name, reducer)
    
            await dbForCreate.create(alice.key!)
    
            await dbForCreate.allowWriters(alice.key!, [aliceDid!, bobDid!])
    
    
            // now we're going to create a new database that would be the equivalent of a user database
    
            const aliceDb = new Database(name, reducer)
            await aliceDb.start(alice)

            await new Promise((resolve)=> {
                aliceDb.once('initialSync', resolve)
            })

            const syncPromise = new Promise((resolve)=> {
                aliceDb.once('sync', resolve)
            })

            // and alice will write to the db
            aliceDb.dispatch({msg: 'hi from alice'})
    
            // it immediately updates
            expect(aliceDb.state.msg).to.equal("hi from alice")

            await syncPromise

            // now when bob starts his db, he'll get the latest from alice's update
            const bobDb = new Database(name, reducer)
            await bobDb.start(bob)

            await new Promise((resolve)=> {
                bobDb.once('initialSync', resolve)
            })

            expect(bobDb.state.msg).to.equal("hi from alice")

            // and now bob can update and alice can see that in real-time

            let aliceUpdate = new Promise((resolve)=> {
                aliceDb.once('update', resolve)
            })

            bobDb.dispatch({msg: 'bob says hi back'})
            await aliceUpdate

            expect(aliceDb.state.msg).to.equal('bob says hi back')

            resolve()
        })
    })
})