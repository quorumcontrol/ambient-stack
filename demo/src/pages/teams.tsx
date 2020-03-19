import React, { useState, ChangeEvent } from 'react'
import { Box, Heading, Button, FormField, Form, DropButton } from 'grommet'
import { useAmbientUser } from '../util/user'
import { Database } from 'ambient-stack'
import { useAmbientDatabase } from '../util/usedatabase'
import { UserTeamsReducer, UserTeamsState, UserTeamsStateUpdateEvt, UserTeamsStateActions } from '../util/teamdb'
import debug from 'debug'
import { Link } from 'react-router-dom'
import { DailyState, DailyStateReducer, DailyAction } from '../util/standupdb'
import { PulseLoader } from 'react-spinners'

const log = debug("pages.teams")

export function Teams() {
    const [state, setState] = useState({ loading: false, teamName: "" })
    const [dropOpen, setDropOpen] = useState(false)
    const { user } = useAmbientUser()

    const [dispatch, teamState, db] = useAmbientDatabase<UserTeamsState, UserTeamsStateUpdateEvt>(user!.userName + "-app-settings", UserTeamsReducer)

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
                setDropOpen(false)
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
        setDropOpen(false)
        return db.create(user?.tree.key!, {
            writers: [did!],
            initialState: {
                users: [user.userName!],
                standups: {},
            }
        })
    }

    const onChange = (evt: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setState({ ...state, teamName: evt.target.value })
    }

    if (!db.initiallyLoaded) {
        return (
            <Box fill align="center" justify="center">
                <PulseLoader />
            </Box>
        )
    }

    const teamLIs = teamState.teams ? teamState.teams.map((teamName: string, i: number) => {
        return (
            <li key={i}><Link to={"/teams/" + teamName}>{teamName}</Link></li>
        )
    }) : []

    return (
        <Box pad="small">
            <Heading size="small">My teams</Heading>
            <ul>
                {teamLIs}
            </ul>

            <DropButton
                margin={{top:"1em"}}
                label="Add"
                dropAlign={{ top: 'bottom', left: 'left' }}
                open={dropOpen}
                onClose={() => setDropOpen(false)}
                onOpen={() => setDropOpen(true)}
                dropContent={
                    <Box align="center" pad="small">
                        <Form>
                            <FormField type="text" label="Team Name" name="teamName" value={state.teamName} onChange={onChange} />
                            <Button label="Create" type="submit" primary onClick={onCreateClick} />
                        </Form>
                    </Box>
                }
            />
        </Box>
    )
}