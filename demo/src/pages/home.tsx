import React, { useState, ChangeEvent, useEffect } from 'react';
import { Box, Heading, Text, Form, FormField, TextArea } from 'grommet';
import { useAmbientUser, getIcon } from '../util/user';
import { useAmbientDatabase, DailyState, DailyStateReducer } from '../util/usedatabase';

import { Previous, Next } from 'grommet-icons';
import { StandupReport, StandupProps } from '../components/standupreport';
import { useParams } from 'react-router';
import debug from 'debug'

const log = debug("pages.home")


export function Home() {
    let { teamName } = useParams();
    const {user} = useAmbientUser()
    const [standup, setStandup] = useState({} as StandupProps)

    log("teamName: ", teamName)

    const [dispatch, db] = useAmbientDatabase<DailyState,StandupProps>(teamName!, DailyStateReducer, {standups:{}})

    const onChange = (evt:ChangeEvent<HTMLTextAreaElement|HTMLInputElement>) => {
        const newState = {...standup, [evt.target.name]: evt.target.value}
        setStandup(newState)
        dispatch(newState)
    }

    // useEffect(()=> {
    //     if (user) {
    //         setStandup({...standup, name: user.userName})
    //     }
    // }, [user, standup])

    let todaysStandups:JSX.Element[] = []

    if (db.standups) {
        todaysStandups = Object.entries(db.standups).map(([_, value], i) => {
            return (<StandupReport
                key={i}
                today={value.today}
                yesterday={value.yesterday}
                blockers={value.blockers}
                name={value.name}
                />
            )
        });
    }

    return (
        <Box fill align="center" justify="center">
            <Box fill pad="small">
                <Heading size="medium">Daily Standups</Heading>
                <Box background="light-2" alignContent="center" justify="around" direction="row" color="light" pad="medium">
                    <Box basis="small" alignSelf="center">
                        <Previous size="xlarge" />
                    </Box>
                    <Box elevation="small" pad="medium" basis="1/2">
                        <Heading size="small">Today</Heading>
                        <Box>
                            <Form>
                                <FormField type="text" label="Plan for today?">
                                    <TextArea name="today" value={standup.today} onChange={onChange}/>
                                </FormField>
                                <FormField type="text" label="Accomplished Yesterday?">
                                    <TextArea name="yesterday" value={standup.yesterday} onChange={onChange}/>
                                </FormField>
                                <FormField type="text" label="Blockers?">
                                    <TextArea name="blockers" value={standup.blockers} onChange={onChange}/>
                                </FormField>
                            </Form>



                        </Box>
                    </Box>
                    <Box pad="medium" align="center" alignSelf="center" basis="small">
                        <Box width="120px" height="120px" round="full" overflow="hidden" align="center" alignContent="center">
                            {getIcon(user!.userName)}
                        </Box>
                        <Text>{user!.userName}</Text>
                    </Box>
                </Box>

                <Box align="center">
                    <Heading size="small">Today's Team Updates</Heading>
                </Box>

                <Box alignContent="center" justify="around" direction="row" pad="medium">

                    <Box basis="small" alignSelf="center">
                        <Previous size="medium" />
                    </Box>
{/* 
                    <StandupReport 
                        name="Carol"
                        today={`Beard copper mug biodiesel, chillwave pork belly quinoa +1. Enamel pin vinyl sriracha forage. Tbh mumblecore cronut yr skateboard. Hot chicken pickled ugh tousled gluten-free.`}
                        yesterday={`Tattooed raclette chicharrones occupy enamel pin coloring book neutra etsy disrupt woke copper mug portland. Slow-carb squid enamel pin, four loko 8-bit intelligentsia small batch keytar shabby chic fingerstache jean short`}
                    /> */}

                    {todaysStandups}
                    

                    <Box basis="small" alignSelf="center">
                        <Next size="medium" />
                    </Box>
                </Box>

                    

            </Box>
        </Box>
    )
}