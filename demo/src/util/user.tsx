import React, { useState, useEffect } from 'react'
import { User, getAppCommunity, verifyAccount, register, Database } from 'ambient-stack';
import { EcdsaKey, Repo } from 'tupelo-wasm-sdk';
import debug from 'debug';

import woman from '../images/woman.jpg'
import man from '../images/man.jpg'
import carol from '../images/carol.jpg'
import { User as UserIcon } from 'grommet-icons';
import { Image } from 'grommet';

import { UserTeamsState, UserTeamsReducer, UserTeamsStateUpdateEvt } from './teamdb';
import { EventEmitter } from 'events';

const log = debug("util.user")

export const userNamespace = Buffer.from('demo-only-async-daily-standups')
const Key = require("interface-datastore").Key

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

const usernameKey = new Key("username")
const privateKeyKey = new Key("privateKey")

class AppUser extends EventEmitter {
    user?: User
    userPromise?: Promise<User | undefined>
    repo: Promise<Repo>

    constructor() {
        super()
        this.repo = new Promise(async (resolve) => {
            const repo = new Repo("ambientUser")
            await repo.init({})
            await repo.open()
            resolve(repo)
        })
        this.loadFromRepo()
    }

    async logout() {
        const repo = await this.repo
        await repo.delete(usernameKey)
        await repo.delete(privateKeyKey)
        this.user = undefined
        this.userPromise = undefined
        this.emit('update')
        return
    }

    async login(username: string, password: string): Promise<[boolean, User?]> {
        const repo = await this.repo
        const [found, user] = await verifyAccount(username, password, userNamespace)
        if (found) {
            await repo.put(usernameKey, Buffer.from(username))
            //TODO: need to more securely store the private key here
            await repo.put(privateKeyKey, user?.tree.key?.privateKey!)
            this.user = user
            this.userPromise = Promise.resolve(user!)
            this.emit('update')
            return [true, user]
        }
        return [false, undefined]
    }

    async register(username: string, password: string): Promise<User> {
        log('registering user')
        const repo = await this.repo

        const user = await register(username, password, userNamespace)
        await repo.put(usernameKey, Buffer.from(username))
        //TODO: need to more securely store the private key here
        await repo.put(privateKeyKey, user.tree.key?.privateKey!)

        log('setting up teams database')
        // setup their app database
        const did = await user.tree.id()
        const db = new Database<UserTeamsState, UserTeamsStateUpdateEvt>(username + "-app-settings", UserTeamsReducer)
        await db.create(user.tree.key!, {
            writers: [did!],
            initialState: {
                teams: [],
            }
        })
        this.user = user
        this.userPromise = Promise.resolve(user)
        this.emit('update')
        log('done')
        return user
    }

    async loadFromRepo() {
        if (this.userPromise) {
            return this.userPromise
        }
        this.userPromise = new Promise<User | undefined>(async (resolve) => {
            log("fetching user")
            const repo = await this.repo
            let username: string
            try {
                username = await repo.get(usernameKey)
            } catch (e) {
                if (e.code === "ERR_NOT_FOUND") {
                    resolve(undefined)
                    return // no user
                }
                throw e
            }

            const privateKey = await repo.get(privateKeyKey)

            const c = await getAppCommunity()
            const key = await EcdsaKey.fromBytes(privateKey)
            let user
            try {
                user = await User.find(username.toString(), userNamespace, c)
            } catch (e) {
                if (e.message === "no tree found") {
                    await this.logout()
                    resolve(undefined)
                    return // no user
                }
                throw e
            }
            user.tree.key = key
            await user.load()
            resolve(user)
        })
        this.userPromise.then((user: User | undefined) => {
            this.user = user
        }).finally(() => {
            this.emit('update')
        })
        return this.userPromise
    }

}

const appUser = new AppUser()


interface AmbientUserReturn {
    loading: boolean
    user?: User
    logout: () => Promise<void>
    login: (username: string, password: string) => Promise<[boolean, User?]>
    register: (username: string, password: string) => Promise<User>
}


export function useAmbientUser(): AmbientUserReturn {

    const [state, setState] = useState({ 
        loading: !(appUser.user),
        user: appUser.user, 
        login: appUser.login.bind(appUser), 
        logout: appUser.logout.bind(appUser),
        register: appUser.register.bind(appUser),
    } as AmbientUserReturn)

    useEffect(() => {
        appUser.on('update', () => {
            if (appUser.user) {
                setState((st) => {
                    return { ...st, loading: false, user: appUser.user }
                })
                return
            }

            // otherwise no user, so just set to undefined
            setState((st) => {
                return { ...st, loading: false, user: undefined }
            })
        })

        // in the case where it's already loaded, load it
        if (appUser.user) {
            setState((st) => {
                return { ...st, loading: false, user: appUser.user }
            })
            return
        }
    }, [appUser])

    return state
}