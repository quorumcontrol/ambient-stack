import React, { MouseEvent } from 'react'
import { Box, Text, Button } from 'grommet'
import { useLocation, useHistory } from 'react-router'
import { Checkmark } from 'grommet-icons'

// A custom hook that builds on useLocation to parse
// the query string for you.
function useQuery() {
    return new URLSearchParams(useLocation().search);
}

interface PermissionProps {
    name: string
}

function PermissionRequest({ name }: PermissionProps) {
    return (
        <Box direction="row" pad="medium" border="top">
            <Box basis="xxsmall">
                <Checkmark color="green" />
            </Box>
            <Text>{name}</Text>
        </Box>
    )
}

export function SSO() {
    const query = useQuery()
    const history = useHistory()

    const onAllow = (evt:MouseEvent)=> {
        evt.preventDefault()
        history.goBack()
    }

    return (
        <Box fill align="center" justify="center" pad="1em">
            <Box width="large" border="all" pad="1em">
                <Box margin={{bottom: "medium"}}>
                <Text>Hello {query.get('username')}</Text>
                <Text>The app "demo app" wants to have the following permissions</Text>
                </Box>

                <PermissionRequest name="Control an app-specific ChainTree" />
                <PermissionRequest name="Create an off-chain database" />
                <Box direction="row" justify="between" margin={{ top: "medium" }}>
                    <Button primary label="Allow" onClick={onAllow}/>
                    <Button label="deny" />
                </Box>
            </Box>

        </Box>
    )
}