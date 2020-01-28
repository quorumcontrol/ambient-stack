import React from 'react';
import { Box, Heading, Text} from 'grommet';
import { getIcon } from '../util/user';

export interface StandupProps {
    name: string
    today?: string
    yesterday?:string
    blockers?:string
    icon?: JSX.Element
}

export function StandupReport({today,yesterday,blockers, name, icon}:StandupProps) {

    return (
        <Box elevation="small" pad="medium" basis="medium">
        <Box align="center">
            <Box width="120px" align="center" alignContent="center" height="120px" round="full" overflow="hidden" border="all">
                {icon ? icon : getIcon(name)}
            </Box>
            <Heading size="24px">{name}</Heading>

            <Text weight="bold">
                Plan for today
            </Text>
            <Text margin="small">
            {today}
            </Text>

            <Text weight="bold">
                Accomplished Yesterday
            </Text>
            <Text margin="small">
                {yesterday}
            </Text>

            <Text weight="bold">
                Blockers
            </Text>
            <Text margin="small">
                {blockers ? blockers : "None"}
            </Text>
        </Box>
    </Box>
    )
}