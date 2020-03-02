import React, { useState, ChangeEvent } from 'react'
import { Box, Heading, Button, FormField, Form } from 'grommet'
import { useAmbientUser } from '../util/user'
import { Database } from 'ambient-stack'
import { useAmbientDatabase } from '../util/usedatabase'
import { UserTeamsReducer, UserTeamsState, UserTeamsStateUpdateEvt, UserTeamsStateActions } from '../util/teamdb'
import debug from 'debug'
import { Link } from 'react-router-dom'
import { defaultState, DailyState, DailyStateReducer, DailyAction } from '../util/standupdb'

const log = debug("pages.teams")

export function Teams() {
    const [state, setState] = useState({ loading: false, teamName: "" })
    const { user } = useAmbientUser()

    const [dispatch, teamState] = useAmbientDatabase<UserTeamsState, UserTeamsStateUpdateEvt>(user!.userName + "-teams", UserTeamsReducer, { teams: [] })

    const onCreateClick = async () => {
        dispatch({
            type: UserTeamsStateActions.ADD,
            name: state.teamName,
        } as UserTeamsStateUpdateEvt)
        log("creating standup database: ", state.teamName)
        const db = new Database<DailyState, DailyAction>(state.teamName, DailyStateReducer, defaultState)
        await db.create(user?.tree.key!)
        const did = await user?.tree.id()

        log("allowing writers")
        await db.allowWriters(user?.tree.key!, [did!])
        log('writers allowed')
    }

    const onChange = (evt: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setState({ ...state, teamName: evt.target.value })
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