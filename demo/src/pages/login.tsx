import React, { useState, FormEvent, ChangeEvent } from 'react';
import { Box, Heading, Form, FormField, Button, Text, Tabs, Tab } from 'grommet';
import { PulseLoader } from 'react-spinners';
import { useAmbientUser } from 'ambient-react';
import { Redirect } from "react-router";
import debug from 'debug'

const log = debug("pages.login")

export function Login() {
    const [state, setState] = useState({ loading: false } as {
        username: string,
        password: string,
        passwordConfirmation: string,
        loading: boolean,
        error: string,
        success: boolean,
    })

    const { login, register } = useAmbientUser()
    const [index, setIndex] = useState(0);

    const onActive = (nextIndex: number) => setIndex(nextIndex);

    const onChange = (evt: ChangeEvent<HTMLInputElement>) => {
        setState({ ...state, [evt.target.name]: evt.target.value })
    }

    const onLogin = async (evt: FormEvent) => {
        evt.preventDefault()
        setState((state) => { return { ...state, loading: true } })

        if (!state.username || !state.password) {
            setState((state) => { return { ...state, loading: false, error: "missing fields" } })
            return
        }

        log("login pushed: ", state.username)
        const [found] = await login(state.username, state.password)
        if (!found) {
            setState((state) => { return { ...state, loading: false, error: "user not found" } })
            return
        }
        log("user found, success: true")
        setState((state) => { return { ...state, loading: false, success: true } })
    }

    const onRegister = async (evt: any) => {
        evt.preventDefault()

        if (state.password !== state.passwordConfirmation) {
            setState((state) => { return { ...state, error: "passwords do not match", loading: false } })
            return
        }

        setState((state) => { return { ...state, loading: true } })

        if (!state.username || !state.password) {
            setState((state) => { return { ...state, loading: false, error: "missing fields" } })
            return
        }

        await register(state.username, state.password)
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
                                <Form onSubmit={onRegister}>
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