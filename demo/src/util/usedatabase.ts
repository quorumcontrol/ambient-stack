import {useState} from 'react'
import {FreezeObject} from 'automerge'
import { DecentralizedDatabase, Reducer } from 'ambient-stack';

export function useDecentralizedDatabase<S,A>(name:string, reducer:Reducer<S,A>):[(action:A)=>void, S] {
    const [db, setDb] = useState(undefined as undefined|DecentralizedDatabase<S,A>)
    const [state,setState] = useState({} as FreezeObject<S>)

    if (db !== undefined) {
        return [db.dispatch.bind(db), state as S]
    }
    const newDb = new DecentralizedDatabase<S,A>(name, reducer)
    setState(newDb.state)
    setDb(newDb)

    newDb.on('update', ()=> {
        setState(newDb.state)
    })

    return [newDb.dispatch.bind(newDb), state as S]
}
