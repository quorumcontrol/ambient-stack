import React, { useState, FormEvent } from 'react';
import { useHistory } from 'react-router';
import { getAppCommunity, findUserAccount } from 'ambient-stack';
import { Box, Heading, Form, FormField, Button } from 'grommet';
import { PulseLoader } from 'react-spinners';

export function Login() {
    const [state, setState] = useState({} as { username: string, loading: boolean })
    const history = useHistory()

    const onChange = (evt:any) => { 
        setState({...state, username: evt.target.value})
    }


    const onLogin = async (evt: FormEvent) => {
        evt.preventDefault()
        setState({...state, loading: true })
        const c = getAppCommunity()

        const acct = await findUserAccount(state.username)
        console.log("found: ", acct)
        history.push("/sso?username=" + state.username)

        // on login, create a private key, store it, send the user over to their chosen wallet
        // on return from wallet
        // collect chaintreeID from the hash
    }

    return (
        <Box fill align="center" justify="center">
            {state.loading && <PulseLoader />}
            {!state.loading &&
                <Box width="large">
                    <Heading size="small">Login</Heading>
                    <Form onSubmit={onLogin}>
                        <FormField label="Username" value={state.username} onChange={onChange} />
                        <Button primary type="submit" label="Submit" />
                    </Form>
                </Box>
            }
        </Box>
    )
}