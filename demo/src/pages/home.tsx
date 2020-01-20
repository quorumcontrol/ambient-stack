import React, { useState, FormEvent } from 'react';
import { Box, Form, FormField, Heading, Button } from 'grommet';
import { useHistory } from 'react-router';

export function Home() {

    const [state,setState] = useState({} as {username:string})
    const history = useHistory()

    const onLogin = (evt:FormEvent)=> {
        evt.preventDefault()
        history.push("/sso?username=" + state.username)
        // on login, create a private key, store it, send the user over to their chosen wallet
        // on return from wallet
        // collect chaintreeID from the hash
    }

    return (
        <Box fill align="center" justify="center">
            <Box width="large">
                <Heading size="small">Home</Heading>
                <Form onSubmit={onLogin}>
                    <FormField type="text" label="Username" value={state.username} onChange={(evt)=> { setState({username: evt.target.value}) }}/>
                    <Button primary type="submit" label="Submit"/>
                </Form>
            </Box>
        </Box>
    )
}