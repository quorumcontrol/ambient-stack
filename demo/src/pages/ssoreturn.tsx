import React, { useEffect } from 'react'

import { useQuery } from "../util/usequery";
import { Redirect } from "react-router";


export function SSOReturnPage() {
    const query = useQuery()

    useEffect(()=>{
      const username = query.get("username")
      if (username) {
        console.log("setting local storage to username", username)
        sessionStorage.setItem("username", username)
      }
    }, [query])

    return (
        <Redirect 
          to={{
            pathname: "/",
          }}
        />
    )

}