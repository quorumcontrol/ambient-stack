import React, { useState, FormEvent, ChangeEvent, useEffect} from 'react';
import { useHistory } from 'react-router';
import { Box, Heading, Form, FormField, Button } from 'grommet';
import { PulseLoader } from 'react-spinners';
import { useUserRepo, login, signup } from '../util/user';
import { Redirect } from "react-router";

export function Login() {
    const [state, setState] = useState({loading:true} as { 
        username: string, 
        password:string, 
        loading: boolean,
        error: string,
        success: boolean,
    })
    const history = useHistory()

    const {repo,loading} = useUserRepo()

    useEffect(()=> {
        if (!loading) {
            setState((s)=> {
                return {...s, loading: false}
            })
        }
    },[loading])

    const onChange = (evt:ChangeEvent<HTMLInputElement>) => {
        setState({...state, [evt.target.name]: evt.target.value})
    }

    const onLogin = async (evt: FormEvent) => {
        evt.preventDefault()
        if (!repo) {
            throw new Error("need a repo to login (this should never happen)")
        }

        setState((state)=> {return {...state, loading: true }})

        if (!state.username || !state.password) {
            setState((state)=> {return {...state, loading: false, error: "missing fields" }})
            return
        }

        console.log("login pushed: ", state.username)
        const [found] = await login(state.username, state.password, repo)
        if (!found) {
            setState((state)=> {return {...state, loading: false, error: "user not found" }})
            return
        }

        setState((state)=> {return {...state, loading: false, success:true}})
    }

    const register = async (evt:any) => {
        evt.preventDefault()
        if (!repo) {
            throw new Error("need a repo to login (this should never happen)")
        }

        setState((state)=> {return {...state, loading: true }})

        if (!state.username || !state.password) {
            setState((state)=> {return {...state, loading: false, error: "missing fields" }})
            return
        }

        await signup(state.username,state.password,repo)
        setState((state)=> {return {...state, loading: false, success:true}})
    }

    if (state.success) {
        return (
            <Redirect 
            to={{
              pathname: "/",
            }}
          />
        )
    }

    return (
        <Box fill align="center" justify="center">
            {state.loading && <PulseLoader />}
            {!state.loading &&
                <Box width="large">
                    <Heading size="small">Login</Heading>
                    <p>{state.error}</p>
                    <Form onSubmit={onLogin}>
                        <FormField label="Username" value={state.username} name="username" onChange={onChange} />
                        <FormField label="Password" value={state.password} name="password" type="password" onChange={onChange} />
                        <Button primary type="submit" label="Login" />
                    </Form>
                    <Button label="Register" onClick={register}/>
                </Box>
            }
        </Box>
    )
}