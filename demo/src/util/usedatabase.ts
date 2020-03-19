import {useState, useEffect} from 'react'
import {FreezeObject} from 'automerge'
import { Database, Reducer } from 'ambient-stack';
import { useAmbientUser } from './user';
import debug from 'debug'

const log = debug("util.usedatabase")

export type dispatcher<A> = (action:A)=>void

export function useAmbientDatabase<S,A>(name:string, reducer:Reducer<S,A>):[dispatcher<A>, S, Database<S,A>] {
    const {user} = useAmbientUser()

    const [db, setDb] = useState(undefined as undefined|Database<S,A>)
    const [state,setState] = useState({} as FreezeObject<S>)
    useEffect(()=> {
        if(user && db) {
            db.start(user.tree)
        }
    }, [user,db])

    useEffect(()=> {
        if (!db) {
            return
        }

        const onUpdate = ()=> {
            log('updating state: ', db.state)
            setState(db.state)
        }

        const onSync = ()=> {
            log('sync')
            setState(db.state)
        }

        db.on('update', onUpdate)
        db.once('initialLocalSync', onSync)
        db.once('initialSync', onSync)

        return ()=> {
            db.off('update', onUpdate)
            db.off('initialLocalSync', onSync)
            db.off('initialSync', onSync)
        }
    }, [db])

    if (db !== undefined) {
        return [db.dispatch.bind(db), state as S, db]
    }
    const newDb = new Database<S,A>(name, reducer)
    setState(newDb.state)
    setDb(newDb)

    return [newDb.dispatch.bind(newDb), state as S, newDb]
}
