import React from 'react'
import { Header, Button, Box, Text, Menu } from 'grommet'
import { Home } from 'grommet-icons'
import { useAmbientUser, useUserRepo, logout, getIcon } from '../util/user'
import { useHistory } from 'react-router'
import { User } from '../../../lib'


const Avatar = ({ user }: { user: User }) => {
    return (
        <Box pad="small" align="center" alignSelf="center" basis="small">
            <Box width="60px" height="60px" round="full" overflow="hidden" align="center" alignContent="center">
                {getIcon(user!.userName)}
            </Box>
            <Text>{user!.userName}</Text>
        </Box>
    )
}

const UserHeader = ({ user }: { user: User }) => {
    const history = useHistory()
    const { repo } = useUserRepo()

    const onLogout = async () => {
        if (!repo) {
            throw new Error("no repo!")
        }

        await logout(repo)
        history.push("/login")
    }

    return (
        <Menu
            label={<Avatar user={user} />}
            items={[
                { label: "logout", onClick: onLogout }
            ]}
        />
    )
}

export const LoggedInLayout = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAmbientUser()

    return (
        <Box fill>
            <Header background={{ color: "light-1" }} pad="small">
                <div>
                    <Button icon={<Home />}></Button>
                    <Text>Async Daily Standups</Text>
                </div>
                {user ? <UserHeader user={user} /> : null}
            </Header>
            <Box fill justify="center" align="center">
                <Box width="xlarge" align="start">
                    {children}
                </Box>
            </Box>
        </Box>
    )
}