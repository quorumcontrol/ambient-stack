import {useState, useEffect} from 'react'
import {FreezeObject} from 'automerge'
import { Database, Reducer, getAppCommunity, User } from 'ambient-stack';
import {  StandupProps } from '../components/standupreport';
import { useAmbientUser } from './user';
import debug from 'debug'

const log = debug("util.usedatabase")


export interface DailyState {
    standups: {[key: string]: StandupProps} 
}

export const DailyStateReducer = (doc: DailyState, standup: StandupProps) => {
    if (doc.standups === undefined) {
        doc.standups = {}
    }
    if (standup.today === undefined || standup.today === "") {
        delete doc.standups[standup.name]
        return
    }
    doc.standups[standup.name] = standup
}


export function useAmbientDatabase<S,A>(name:string, reducer:Reducer<S,A>, initialState?:S):[(action:A)=>void, S] {
    const {user} = useAmbientUser()

    getAppCommunity() // just to make sure it gets setup

    const [db, setDb] = useState(undefined as undefined|Database<S,A>)
    const [state,setState] = useState({} as FreezeObject<S>)
    useEffect(()=> {
        if(user && db) {
            db.start(user.tree)
        }
    }, [user,db])


    if (db !== undefined) {
        return [db.dispatch.bind(db), state as S]
    }
    const newDb = new Database<S,A>(name, reducer, initialState)
    setState(newDb.state)
    setDb(newDb)

    newDb.on('update', ()=> {
        setState(newDb.state)
    })

    newDb.once('initialSync', ()=> {
        setState(newDb.state)
    })


    return [newDb.dispatch.bind(newDb), state as S]
}
