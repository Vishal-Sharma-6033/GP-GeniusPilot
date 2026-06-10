import { createContext, useState } from "react";


export const AuthContext = createContext()


export const AuthProvider = ({ children }) => { 

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [credits, setCredits] = useState(0)

    const updateCredits = (newCredits) => {
        setCredits(newCredits)
        if (user) {
            setUser({ ...user, credits: newCredits })
        }
    }

    return (
        <AuthContext.Provider value={{ user, setUser, loading, setLoading, credits, setCredits, updateCredits }} >
            {children}
        </AuthContext.Provider>
    )

    
}