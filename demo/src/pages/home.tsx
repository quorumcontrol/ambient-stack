import React, { useState } from 'react';
import { Box, Heading, Image, Text, Form, FormField, TextArea } from 'grommet';
import { useAmbientUser } from '../util/user';
import { useDecentralizedDatabase } from '../util/usedatabase';

import woman from '../images/woman.jpg'
import { Previous, UserFemale, User, Next } from 'grommet-icons';
import { StandupReport } from '../components/standupreport';

interface message {
    body: string
    from: string
}

interface AppState {
    messages: message[]
}

const reducer = (doc: AppState, msg: message) => {
    if (doc.messages === undefined) {
        doc.messages = []
    }
    doc.messages.push(msg)
}


function Message({ msg }: { msg: message }) {
    return (
        <Box pad="medium" border="bottom">
            <Text>{msg.from}: {msg.body}</Text>
        </Box>
    )
}


export function Home() {

    const [state, setState] = useState({} as { message: string })

    // const {user} = useAmbientUser()

    // const [dispatch, db] = useDecentralizedDatabase<AppState,message>("ambientdemo", reducer)

    // const handleSubmit = (evt:FormEvent) => {
    //     evt.preventDefault()
    //     if (user !== undefined) {
    //         dispatch({body: state.message, from: user.userName})
    //         setState({...state, message: ""})
    //     }
    // }

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
                                    <TextArea />
                                </FormField>
                                <FormField type="text" label="Accomplished Yesterday?">
                                    <TextArea />
                                </FormField>
                                <FormField type="text" label="Blockers?">
                                    <TextArea />
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
                        name="Alice"
                        icon={<UserFemale size="xlarge"/>}
                        today={`Beard copper mug biodiesel, chillwave pork belly quinoa +1. Enamel pin vinyl sriracha forage. Tbh mumblecore cronut yr skateboard. Hot chicken pickled ugh tousled gluten-free.`}
                        yesterday={`Tattooed raclette chicharrones occupy enamel pin coloring book neutra etsy disrupt woke copper mug portland. Slow-carb squid enamel pin, four loko 8-bit intelligentsia small batch keytar shabby chic fingerstache jean short`}
                    />

                    <StandupReport 
                        name="Bob"
                        icon={<User size="xlarge"/>}
                        today={`Beard copper mug biodiesel, chillwave pork belly quinoa +1. Enamel pin vinyl sriracha forage. Tbh mumblecore cronut yr skateboard. Hot chicken pickled ugh tousled gluten-free.`}
                        yesterday={`Tattooed raclette chicharrones occupy enamel pin coloring book neutra etsy disrupt woke copper mug portland. Slow-carb squid enamel pin, four loko 8-bit intelligentsia small batch keytar shabby chic fingerstache jean short`}
                    />

                    <StandupReport 
                        name="Carol"
                        icon={<UserFemale size="xlarge"/>}
                        today={`Beard copper mug biodiesel, chillwave pork belly quinoa +1. Enamel pin vinyl sriracha forage. Tbh mumblecore cronut yr skateboard. Hot chicken pickled ugh tousled gluten-free.`}
                        yesterday={`Tattooed raclette chicharrones occupy enamel pin coloring book neutra etsy disrupt woke copper mug portland. Slow-carb squid enamel pin, four loko 8-bit intelligentsia small batch keytar shabby chic fingerstache jean short`}
                    />

                    

                    <Box basis="small" alignSelf="center">
                        <Next size="medium" />
                    </Box>
                </Box>

                    

            </Box>
        </Box>
    )
}