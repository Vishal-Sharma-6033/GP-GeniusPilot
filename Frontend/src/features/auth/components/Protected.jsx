import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router";
import React from 'react'

const Protected = ({children}) => {
    const { loading, user, isClerkSignedIn } = useAuth()

    // If Clerk auth is active but backend sync hasn't finished, keep loading
    // instead of redirecting to sign-in. Prevents flash-of-redirect when Clerk
    // has restored a session but the backend clerkSync call is still in flight.
    if (loading || (!user && isClerkSignedIn)) {
        return (<main><h1>Loading...</h1></main>)
    }

    if(!user){
        return <Navigate to={'/sign-in'} />
    }
    
    return children
}

export default Protected