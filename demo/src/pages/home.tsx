import React, { useState, ChangeEvent, useEffect, FormEvent } from 'react';
import { Box, Heading, Text, Form, FormField, TextArea, Button } from 'grommet';
import { useAmbientUser, getIcon, userNamespace } from '../util/user';
import { useAmbientDatabase, } from '../util/usedatabase';
import { Previous, Next } from 'grommet-icons';
import { StandupReport, StandupProps } from '../components/standupreport';
import { useParams } from 'react-router';
import { DailyState, DailyStateReducer, DailyAction, addStandupAction, addUserAction } from '../util/standupdb';
import { Database, findUserAccount } from 'ambient-stack';
import debug from 'debug'
import { PulseLoader } from 'react-spinners';

const log = debug("pages.home")

function UserList({ database, userNames }: { database: Database<DailyState, DailyAction>, userNames: string[] }) {
    let teamUsers: JSX.Element[] = []
    const { user } = useAmbientUser()
    const [userName, setUserName] = useState("")

    if (userNames) {
        teamUsers = userNames.map((userName: string, i: number) => {
            return (
                <li key={"user-" + i.toString()}>{userName}</li>
            )
        })
    }

    const onChange = (evt: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setUserName(evt.target.value)
    }

    const onSubmit = async (evt: FormEvent) => {
        evt.preventDefault()
        if (!user) {
            throw new Error("must have an admin user")
        }
        database.dispatch(addUserAction(userName))
        const userTree = await findUserAccount(userName, userNamespace)
        if (!userTree) {
            throw new Error("not found")
        }

        const userDid = await userTree?.id()
        database.allowWriters(user.tree.key!, [userDid!])
        log("allowed ", userName)
    }

    return (
        <Box alignContent="center" justify="around" direction="row" pad="medium">
            <Heading size="small">Users in this team</Heading>
            <ul>
                {teamUsers}
            </ul>
            <Form onSubmit={onSubmit}>
                <FormField name="username" label="User to add" value={userName} onChange={onChange} />
                <Button type="submit" primary>Add</Button>
            </Form>
        </Box>

    )

}


export function Home() {
    let { teamName } = useParams();
    const { user } = useAmbientUser()
    const [standup, setStandup] = useState({} as StandupProps)

    const [dispatch, dbState, db] = useAmbientDatabase<DailyState, DailyAction>(teamName!, DailyStateReducer)

    const onChange = (evt: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const newState = { ...standup, [evt.target.name]: evt.target.value }
        setStandup(newState)
        dispatch(addStandupAction(newState))
    }

    useEffect(() => {
        if (user && standup.name !== user.userName) {
            setStandup((st) => { return { ...st, name: user.userName } })
        }
    }, [user, standup])

    useEffect(()=> {
        log("setting db once")
        db.once('initialSync', ()=> {
            log("initial sync on home page")
            setStandup((st) => { 
                const newState = {...st}
                const dbStandup = db.state?.standups[user!.userName] || {}
                log("dbStandup: ", dbStandup)
                for (let key of ["today", "yesterday", "blockers"]) {
                    if (!Reflect.get(newState, key)) {
                        Reflect.set(newState, key, Reflect.get(dbStandup, key))
                    }
                }
                return newState
            })
        })
    }, [db])


    if (!db.initiallyLoaded) {
        return (
            <Box fill align="center" justify="center">
                <PulseLoader />
            </Box>
        )
    }

    const todaysStandups = dbState.users.map((userName, i) => {
        let standup = dbState.standups[userName]
        if (!standup) {
            standup = {name: userName}
        }
        return (<StandupReport
            key={i}
            today={standup.today}
            yesterday={standup.yesterday}
            blockers={standup.blockers}
            name={standup.name}
        />
        )
    });

    return (
        <Box fill align="center" justify="center">
            <Box fill pad="small">
                <Heading size="medium">Daily Standups</Heading>
                <Box background="light-2" alignContent="center" justify="around" direction="row" color="light" pad="medium">
                    {/* <Box basis="small" alignSelf="center">
                        <Previous size="xlarge" />
                    </Box> */}
                    <Box elevation="small" pad="medium" basis="1/2">
                        <Heading size="small">Today</Heading>
                        <Box>
                            <Form>
                                <FormField type="text" label="Plan for today?">
                                    <TextArea name="today" value={standup.today} onChange={onChange} />
                                </FormField>
                                <FormField type="text" label="Accomplished Yesterday?">
                                    <TextArea name="yesterday" value={standup.yesterday} onChange={onChange} />
                                </FormField>
                                <FormField type="text" label="Blockers?">
                                    <TextArea name="blockers" value={standup.blockers} onChange={onChange} />
                                </FormField>
                            </Form>



                        </Box>
                    </Box>
                </Box>

                <Box align="center">
                    <Heading size="small">Today's Team Updates</Heading>
                </Box>

                <Box alignContent="center" justify="around" direction="row" pad="medium">

                    <Box basis="small" alignSelf="center">
                        <Previous size="medium" />
                    </Box>

                    {todaysStandups}

                    <Box basis="small" alignSelf="center">
                        <Next size="medium" />
                    </Box>
                </Box>

                {/* <UserList database={db} userNames={dbState.users} /> */}

            </Box>
        </Box>
    )
}