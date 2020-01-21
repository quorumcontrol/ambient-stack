import {useState, useEffect} from 'react'
import { User, getAppCommunity } from 'ambient-stack';
import { ChainTree, EcdsaKey } from 'tupelo-wasm-sdk';

interface AmbientUserReturn {
    loading: boolean
    user?:User
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