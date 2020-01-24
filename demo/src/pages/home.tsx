import React, { useState, FormEvent } from 'react';
import { Box, Heading, Image, Text, Form, FormField, TextArea } from 'grommet';
import { useAmbientUser } from '../util/user';
import { useDecentralizedDatabase } from '../util/usedatabase';

import woman from '../images/woman.jpg'
import { Previous } from 'grommet-icons';

interface message {
    body: string
    from: string
}

interface AppState {
    messages: message[]
}

const reducer = (doc: AppState, msg: message) => {
    if (doc.messages === undefined) {
        doc.messages = []
    }
    doc.messages.push(msg)
}


function Message({ msg }: { msg: message }) {
    return (
        <Box pad="medium" border="bottom">
            <Text>{msg.from}: {msg.body}</Text>
        </Box>
    )
}


export function Home() {

    const [state, setState] = useState({} as { message: string })

    // const {user} = useAmbientUser()

    // const [dispatch, db] = useDecentralizedDatabase<AppState,message>("ambientdemo", reducer)

    // const handleSubmit = (evt:FormEvent) => {
    //     evt.preventDefault()
    //     if (user !== undefined) {
    //         dispatch({body: state.message, from: user.userName})
    //         setState({...state, message: ""})
    //     }
    // }

    return (
        <Box fill align="center" justify="center">
            <Box fill pad="small">
                <Heading size="medium">Async daily standups</Heading>
                <Box background="light-2" alignContent="center" justify="around" direction="row" color="light" pad="medium">
                    <Box basis="small" alignSelf="center">
                        <Previous size="xlarge"/>
                    </Box>
                    <Box elevation="small" pad="medium" basis="1/4">
                        <Heading size="small">Yesterday</Heading>
                    </Box>
                    <Box elevation="small" pad="medium" basis="1/4">
                        <Heading size="small">Today</Heading>
                        <Box>
                            <Form>
                                <FormField type="text" label="Plan for today?">
                                    <TextArea />
                                </FormField>
                                <FormField type="text" label="Accomplished Yesterday?">
                                    <TextArea />
                                </FormField>
                                <FormField type="text" label="Blockers?">
                                    <TextArea />
                                </FormField>
                            </Form>
                        </Box>
                    </Box>
                    <Box pad="medium"  align="center" alignSelf="center" basis="small">
                        <Box width="120px" height="120px" round="full" overflow="hidden">
                            <Image fit="cover" src={woman} />
                        </Box>
                        <Text>You</Text>

                    </Box>
                </Box>
            </Box>
        </Box>
    )
}