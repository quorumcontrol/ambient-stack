import React from 'react';
import { Box, Heading } from 'grommet';
import { useAmbientUser } from '../util/user';


export function Home() {

    const {user} = useAmbientUser()

    return (
        <Box fill align="center" justify="center">
            <Box width="large">
                <Heading>Hello {user?.userName}</Heading>
            </Box>
        </Box>
    )
}