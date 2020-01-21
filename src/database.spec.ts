import 'mocha'
import {expect} from 'chai'

import * as Automerge from 'automerge'

import {DecentralizedDatabase} from './database'

describe("database", ()=> {

    it("mutates", ()=> {

        interface appState {
            name: string
        }

        interface appEvent {
            type: string
        }

        const reducer = (state:appState,evt:appEvent)=> {
            state.name = "bye"
        }

        const db = new DecentralizedDatabase("db-test", reducer)
        db.dispatch({type: 'hi'})
        expect(db.state.name).to.equal("bye")
    })
})