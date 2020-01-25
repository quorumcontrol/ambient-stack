import React, { useState, ChangeEvent } from 'react';
import { Box, Heading, Image, Text, Form, FormField, TextArea } from 'grommet';
import { useAmbientUser } from '../util/user';
import { useDecentralizedDatabase } from '../util/usedatabase';

import woman from '../images/woman.jpg'
import { Previous, UserFemale, User, Next } from 'grommet-icons';
import { StandupReport, StandupProps } from '../components/standupreport';


interface AppState {
    standups: {[key: string]: StandupProps} 
}

const reducer = (doc: AppState, standup: StandupProps) => {
    if (doc.standups === undefined) {
        doc.standups = {}
    }
    if (standup.today === undefined || standup.today === "") {
        delete doc.standups[standup.name]
        return
    }
    doc.standups[standup.name] = standup
}

export function Home() {

    const userName = "alice"
    const defaultIcon = <UserFemale size="xlarge" />

    const [standup, setStandup] = useState({name: userName} as StandupProps)

    // const {user} = useAmbientUser()

    const [dispatch, db] = useDecentralizedDatabase<AppState,StandupProps>("2020-01-25", reducer)

    const onChange = (evt:ChangeEvent<HTMLTextAreaElement>) => {
        setStandup({...standup, [evt.target.name]: evt.target.value})
        dispatch(standup)
    }

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
                    <Box elevation="small" pad="medium" basis="1/4">
                        <Heading size="small">Yesterday</Heading>
                    </Box>
                    <Box elevation="small" pad="medium" basis="1/4">
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
                        <Box width="120px" height="120px" round="full" overflow="hidden">
                            <Image fit="cover" src={woman} />
                        </Box>
                        <Text>You</Text>
                    </Box>
                </Box>

                <Box align="center">
                    <Heading size="small">Today's Team Updates</Heading>
                </Box>

                <Box alignContent="center" justify="around" direction="row" pad="medium">

                    <Box basis="small" alignSelf="center">
                        <Previous size="medium" />
                    </Box>

                    <StandupReport 
                        name="Bob"
                        icon={<User size="xlarge"/>}
                        today={`Beard copper mug biodiesel, chillwave pork belly quinoa +1. Enamel pin vinyl sriracha forage. Tbh mumblecore cronut yr skateboard. Hot chicken pickled ugh tousled gluten-free.`}
                        yesterday={`Tattooed raclette chicharrones occupy enamel pin coloring book neutra etsy disrupt woke copper mug portland. Slow-carb squid enamel pin, four loko 8-bit intelligentsia small batch keytar shabby chic fingerstache jean short`}
                    />

                    {todaysStandups}
                    

                    <Box basis="small" alignSelf="center">
                        <Next size="medium" />
                    </Box>
                </Box>

                    

            </Box>
        </Box>
    )
}