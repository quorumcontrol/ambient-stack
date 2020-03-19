import React from 'react'
import { User, Database } from 'ambient-stack';
import debug from 'debug';

import woman from '../images/woman.jpg'
import man from '../images/man.jpg'
import carol from '../images/carol.jpg'
import { User as UserIcon } from 'grommet-icons';
import { Image } from 'grommet';

import { UserTeamsState, UserTeamsReducer, UserTeamsStateUpdateEvt } from './teamdb';
import { AppUser } from 'ambient-react';

const log = debug("util.user")

export const userNamespace = 'demo-only-async-daily-standups'

AppUser.setUserNamespace(userNamespace)

AppUser.afterRegister = async (user: User) => {
    log('setting up teams database')
    // setup their app database
    const did = await user.tree.id()
    const db = new Database<UserTeamsState, UserTeamsStateUpdateEvt>(user.userName + "-app-settings", UserTeamsReducer)
    await db.create(user.tree.key!, {
        writers: [did!],
        initialState: {
            teams: [],
        }
    })
    return user
}

export function getIcon(name: string): JSX.Element {
    let userIcon
    if (name === undefined) {
        name = ""
    }
    switch (name.toLowerCase()) {
        case 'alice':
            userIcon = <Image fit="contain" src={woman} />;
            break;
        case 'bob':
            userIcon = <Image fit="contain" src={man} />;
            break;
        case 'carol':
            userIcon = <Image fit="contain" src={carol} />;
            break;
        default:
            userIcon = <UserIcon size="120px" />
    }
    return userIcon
}
