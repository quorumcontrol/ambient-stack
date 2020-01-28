import React, {useState, useEffect} from 'react'
import { User, getAppCommunity } from 'ambient-stack';
import { ChainTree, EcdsaKey } from 'tupelo-wasm-sdk';

import woman from '../images/woman.jpg'
import man from '../images/man.jpg'
import carol from '../images/carol.jpg'
import { User as UserIcon } from 'grommet-icons';
import { Image } from 'grommet';

interface AmbientUserReturn {
    loading: boolean
    user?:User
}

export function getIcon(name:string): JSX.Element{
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
            userIcon = <UserIcon size="120px"/>
    }
    return userIcon
}

// returns [loading,user]
export function useAmbientUser():AmbientUserReturn {
    const [state,setState] = useState({loading: true} as AmbientUserReturn)
    //TODO: key on much more than just the localStorage
    const stored = sessionStorage.getItem("username")

    useEffect(()=> {
        
        const fetchUser = async ()=> {
            if (stored) {
                console.log("awaiting app community")
                const c = await getAppCommunity()
                const key = await EcdsaKey.generate()
                const tree = await ChainTree.newEmptyTree(c.blockservice, key)
                setState({
                    loading: false,
                    user: new User(stored, tree, c)
                })
                return
            }
            setState({
                loading: false
            })
        }
        fetchUser()

    },[stored])

    return state
}