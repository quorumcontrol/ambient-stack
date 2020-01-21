import React, { useState, FormEvent } from 'react';
import { Box, Heading, Form, FormField, Text } from 'grommet';
import { useAmbientUser } from '../util/user';
import { DecentralizedDatabase, Reducer } from 'ambient-stack';

interface AppState {
    messages: string[]
}


function useDatabase(name:string, reducer:Reducer<AppState,string>):[(action:string)=>void, AppState] {
    const [db, setDb] = useState(undefined as undefined|DecentralizedDatabase<AppState,string>)
    const [state,setState] = useState({} as AppState)

    if (db !== undefined) {
        return [db.dispatch.bind(db), state]
    }
    const newDb = new DecentralizedDatabase(name, reducer)
    setState(newDb.state)
    setDb(newDb)

    newDb.on('update', ()=> {
        setState(newDb.state)
    })

    return [newDb.dispatch.bind(newDb), state]
}

function Message({msg}:{msg:string}) {
    return (
        <Box pad="medium" border="bottom">
            <Text>{msg}</Text>
        </Box>
    )
}


export function Home() {

    const [state,setState] = useState({} as {message:string})

    const {user} = useAmbientUser()

    const [dispatch, db] = useDatabase("ambientdemo", (doc, msg)=> {
        if (doc.messages === undefined) {
            doc.messages = []
        }
        doc.messages.push(msg)
        return doc
    })

    const handleSubmit = (evt:FormEvent) => {
        evt.preventDefault()
        dispatch(state.message)
        setState({...state, message: ""})
    }

    return (
        <Box fill align="center" justify="center">
            <Box width="large">
                <Heading>Hello {user?.userName}</Heading>
                {!db.messages ? <Box /> : db.messages.map((msg, i)=> {
                    return (<Message msg={msg} key={i} />)
                })}
                <Form onSubmit={handleSubmit}>
                    <FormField type="text" label="message" value={state.message} onChange={(evt)=>{setState({...state, message: evt.target.value})}} />
                </Form>
            </Box>
        </Box>
    )
}