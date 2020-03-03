import {useState, useEffect} from 'react'
import {FreezeObject} from 'automerge'
import { Database, Reducer, getAppCommunity } from 'ambient-stack';
import { useAmbientUser } from './user';
import debug from 'debug'

const log = debug("util.usedatabase")

export type dispatcher<A> = (action:A)=>void

export function useAmbientDatabase<S,A>(name:string, reducer:Reducer<S,A>, initialState?:S):[dispatcher<A>, S, Database<S,A>] {
    const {user} = useAmbientUser()

    const [db, setDb] = useState(undefined as undefined|Database<S,A>)
    const [state,setState] = useState({} as FreezeObject<S>)
    useEffect(()=> {
        if(user && db) {
            db.start(user.tree)
        }
    }, [user,db])


    if (db !== undefined) {
        return [db.dispatch.bind(db), state as S, db]
    }
    const newDb = new Database<S,A>(name, reducer, initialState)
    setState(newDb.state)
    setDb(newDb)

    newDb.on('update', ()=> {
        log('updating state: ', newDb.state)
        setState(newDb.state)
    })

    newDb.once('initialSync', ()=> {
        log('initial sync')
        setState(newDb.state)
    })

    return [newDb.dispatch.bind(newDb), state as S, newDb]
}
