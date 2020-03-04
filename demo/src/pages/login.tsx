import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { Box, Heading, Form, FormField, Button, Header, Text, Tabs, Tab } from 'grommet';
import { PulseLoader } from 'react-spinners';
import { useUserRepo, login, signup } from '../util/user';
import { Redirect } from "react-router";
import debug from 'debug'
import { Home } from 'grommet-icons';

const log = debug("pages.login")

export function Login() {
    const [state, setState] = useState({ loading: true } as {
        username: string,
        password: string,
        passwordConfirmation: string,
        loading: boolean,
        error: string,
        success: boolean,
    })

    const { repo, loading } = useUserRepo()
    const [index, setIndex] = useState();

    const onActive = (nextIndex: number) => setIndex(nextIndex);

    useEffect(() => {
        if (!loading) {
            setState((s) => {
                return { ...s, loading: false }
            })
        }
    }, [loading])

    const onChange = (evt: ChangeEvent<HTMLInputElement>) => {
        setState({ ...state, [evt.target.name]: evt.target.value })
    }

    const onLogin = async (evt: FormEvent) => {
        evt.preventDefault()
        if (!repo) {
            throw new Error("need a repo to login (this should never happen)")
        }

        setState((state) => { return { ...state, loading: true } })

        if (!state.username || !state.password) {
            setState((state) => { return { ...state, loading: false, error: "missing fields" } })
            return
        }

        log("login pushed: ", state.username)
        const [found] = await login(state.username, state.password, repo)
        if (!found) {
            setState((state) => { return { ...state, loading: false, error: "user not found" } })
            return
        }
        log("user found, success: true")
        setState((state) => { return { ...state, loading: false, success: true } })
    }

    const register = async (evt: any) => {
        evt.preventDefault()
        if (!repo) {
            throw new Error("need a repo to login (this should never happen)")
        }
        if (state.password !== state.passwordConfirmation) {
            setState((state) => { return { ...state, error: "passwords do not match", loading: false } })
            return
        }

        setState((state) => { return { ...state, loading: true } })

        if (!state.username || !state.password) {
            setState((state) => { return { ...state, loading: false, error: "missing fields" } })
            return
        }

        await signup(state.username, state.password, repo)
        log("signed up")
        setState((state) => { return { ...state, loading: false, success: true } })
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

        <Box width="large">
            {state.loading && <PulseLoader />}
            {!state.loading &&
                <Tabs activeIndex={index} onActive={onActive}>
                    <Tab title="Login">
                        <Box pad="small">
                            <Heading size="small">Login</Heading>
                            <Text color="status-error">{state.error}</Text>
                            <Form onSubmit={onLogin}>
                                <FormField label="Username" value={state.username} name="username" onChange={onChange} />
                                <FormField label="Password" value={state.password} name="password" type="password" onChange={onChange} />
                                <Button primary type="submit" label="Login" />
                                <Box margin={{ top: "1em" }}>
                                    <Button plain label="Or register" onClick={() => setIndex(1)} />
                                </Box>

                            </Form>
                        </Box>
                    </Tab>
                    <Tab title="Register">
                        <Box pad="small">
                            <Heading size="small">Register</Heading>
                            <Text color="status-error">{state.error}</Text>
                            <Form onSubmit={register}>
                                <FormField label="Username" value={state.username} name="username" onChange={onChange} />
                                <FormField label="Password" value={state.password} name="password" type="password" onChange={onChange} />
                                <FormField label="Password Confirmation" value={state.passwordConfirmation} name="passwordConfirmation" type="password" onChange={onChange} />
                                <Button primary type="submit" label="Register" />
                                <Box margin={{ top: "1em" }}>
                                    <Button plain label="Or login" onClick={() => setIndex(0)} />
                                </Box>
                            </Form>
                        </Box>
                    </Tab>
                </Tabs>
            }
        </Box>
        </Box>
    )
}