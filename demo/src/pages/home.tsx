import React, { useState, FormEvent } from 'react';
import { Box, Heading, Form, FormField, Text } from 'grommet';
import { useAmbientUser } from '../util/user';
import {useDecentralizedDatabase} from '../util/usedatabase';

interface message {
    body: string
    from: string
}

interface AppState {
    messages: message[]
}

const reducer = (doc:AppState, msg:message)=> {
    if (doc.messages === undefined) {
        doc.messages = []
    }
    doc.messages.push(msg)
}


function Message({msg}:{msg:message}) {
    return (
        <Box pad="medium" border="bottom">
            <Text>{msg.from}: {msg.body}</Text>
        </Box>
    )
}


export function Home() {

    const [state,setState] = useState({} as {message:string})

    const {user} = useAmbientUser()

    const [dispatch, db] = useDecentralizedDatabase<AppState,message>("ambientdemo", reducer)

    const handleSubmit = (evt:FormEvent) => {
        evt.preventDefault()
        if (user !== undefined) {
            dispatch({body: state.message, from: user.userName})
            setState({...state, message: ""})
        }
    }

    return (
        <Box fill align="center" justify="center">
            <Box width="large">
                <Heading>Hello {user?.userName}</Heading>
                {!db.messages ? <Box /> : db.messages.map((msg:message, i:number)=> {
                    return (<Message msg={msg} key={i} />)
                })}
                <Form onSubmit={handleSubmit}>
                    <FormField type="text" label="message" value={state.message} onChange={(evt)=>{setState({...state, message: evt.target.value})}} />
                </Form>
            </Box>
        </Box>
    )
}