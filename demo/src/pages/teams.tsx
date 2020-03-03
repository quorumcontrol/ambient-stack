import React, { useState, ChangeEvent } from 'react'
import { Box, Heading, Button, FormField, Form } from 'grommet'
import { useAmbientUser, logout, useUserRepo } from '../util/user'
import { Database } from 'ambient-stack'
import { useAmbientDatabase } from '../util/usedatabase'
import { UserTeamsReducer, UserTeamsState, UserTeamsStateUpdateEvt, UserTeamsStateActions } from '../util/teamdb'
import debug from 'debug'
import { Link, useHistory } from 'react-router-dom'
import {  DailyState, DailyStateReducer, DailyAction } from '../util/standupdb'
import { PulseLoader } from 'react-spinners'

const log = debug("pages.teams")

export function Teams() {
    const [state, setState] = useState({ loading: false, teamName: "" })
    const { user } = useAmbientUser()

    const [dispatch, teamState, db] = useAmbientDatabase<UserTeamsState, UserTeamsStateUpdateEvt>(user!.userName + "-app-settings", UserTeamsReducer)
    const {repo} = useUserRepo()
    const history = useHistory()

    const onCreateClick = async () => {
        if (!user) {
            throw new Error("must have a user")
        }
        const db = new Database<DailyState, DailyAction>(state.teamName, DailyStateReducer)

        // first check to see if this db already exists
        const exists = await db.exists()
        if (exists) {
            // then check to see if we're a writer
            if (await db.isWriter(user.did!)) {
                dispatch({
                    type: UserTeamsStateActions.ADD,
                    name: state.teamName,
                } as UserTeamsStateUpdateEvt)
                // nothing else TODO
                return
            }

            throw new Error("you are not a writer on this team")
        }

        // if it doesn't exist then create it

        dispatch({
            type: UserTeamsStateActions.ADD,
            name: state.teamName,
        } as UserTeamsStateUpdateEvt)
        log("creating standup database: ", state.teamName)
        const did = await user?.tree.id()
        return db.create(user?.tree.key!, {
            writers:[did!],
            initialState: {
                users: [user.userName!],
                standups: {},
            }
        })
    }

    const onChange = (evt: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setState({ ...state, teamName: evt.target.value })
    }

    const onLogout = async ()=> {
        if (!repo) {
            throw new Error("no repo!")
        }

        await logout(repo)
        history.push("/login")
    }

    if (!db.initiallyLoaded) {
        return (
            <Box fill align="center" justify="center">
                <PulseLoader />
            </Box>
        )
    }

    log("user: ", user, " team state: ", teamState)

    const teamLIs = teamState.teams ? teamState.teams.map((teamName: string, i: number) => {
        return (
            <li key={i}><Link to={"/teams/" + teamName}>{teamName}</Link></li>
        )
    }) : []

    return (
        <Box fill align="center" justify="center">
            <Box fill pad="small">
                <Heading size="medium">My teams</Heading>
                <p>{user ? user.userName : null}</p>
                <Button onClick={onLogout}>Logout</Button>
                <Box alignContent="center" justify="around" direction="row" color="light" pad="medium">
                    <Form>
                        <FormField type="text" label="Team Name" name="teamName" value={state.teamName} onChange={onChange} />
                        <Button onClick={onCreateClick}>Create</Button>
                    </Form>
                </Box>
                <Box alignContent="center" justify="around" direction="row" color="light" pad="medium">
                    <ul>
                        {teamLIs}
                    </ul>
                </Box>
            </Box>
        </Box>
    )
}