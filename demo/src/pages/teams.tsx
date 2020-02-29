import React, {useState, ChangeEvent} from 'react'
import { Box, Heading, Button, FormField } from 'grommet'
import { useAmbientUser } from '../util/user'
import {getAppCommunity, Database} from 'ambient-stack'
import {DailyState, DailyStateReducer, useAmbientDatabase} from '../util/usedatabase'
import {StandupProps} from '../components/standupreport'

export function Teams() {
    const [state,setState] = useState({loading:false, teamName:""})
    const {user} = useAmbientUser()

    const [dispatch,teamState] = useAmbientDatabase(user!.userName + "-teams", DailyStateReducer)

    const onCreateClick = async ()=> {
        const c = getAppCommunity() // just to make sure it gets setup
        const db = new Database<DailyState,StandupProps>(state.teamName, DailyStateReducer)
        await db.create(user?.tree.key!)
        const did = await user?.tree.id()

        await db.allowWriters(user?.tree.key!, [did!])
        console.log('writers allowed')
        
    }

    const onChange = (evt:ChangeEvent<HTMLTextAreaElement|HTMLInputElement>)=> {
        setState({...state, teamName: evt.target.value})
    }

    return (
        <Box fill align="center" justify="center">
            <Box fill pad="small">
                <Heading size="medium">My teams</Heading>
                <Box background="light-2" alignContent="center" justify="around" direction="row" color="light" pad="medium">
                    <FormField type="text" label="Team Name" name="teamName" value={state.teamName} onChange={onChange}></FormField>
                    <Button onClick={onCreateClick}>Create</Button>
                </Box>
            </Box>
        </Box>
    )
}