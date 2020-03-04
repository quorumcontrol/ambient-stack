import React from 'react'
import { Header, Button, Box, Text, Menu } from 'grommet'
import { Home } from 'grommet-icons'
import { useAmbientUser, getIcon } from '../util/user'
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

const UserHeader = ({ user,logout }: { user: User, logout:()=>Promise<void> }) => {
    const history = useHistory()

    const onLogout = async () => {
        await logout()
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

export const Layout = ({ children }: { children: React.ReactNode }) => {
    const { user,logout } = useAmbientUser()

    return (
        <Box fill>
            <Header background={{ color: "light-1" }} pad="small">
                <div>
                    <Button icon={<Home />}></Button>
                    <Text>Async Daily Standups</Text>
                </div>
                {user ? <UserHeader user={user} logout={logout} /> : null}
            </Header>
            <Box fill justify="center" align="center">
                <Box width="xlarge" align="start">
                    {children}
                </Box>
            </Box>
        </Box>
    )
}