import React, { MouseEvent } from 'react'
import { Box, Text, Button } from 'grommet'
import { useHistory } from 'react-router'
import { Checkmark } from 'grommet-icons'
import { useQuery } from '../util/usequery'

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

    const username = query.get('username')
    if (!username) {
        throw new Error("must specify a username in the queryparams")
    }

    const onAllow = (evt:MouseEvent)=> {
        evt.preventDefault()

        const params = new URLSearchParams()
        params.set("username", username)

        history.replace("/ssoreturn?" + params.toString())
    }

    return (
        <Box fill align="center" justify="center" pad="1em">
            <Box width="large" border="all" pad="1em">
                <Box margin={{bottom: "medium"}}>
                <Text>Hello {username}</Text>
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