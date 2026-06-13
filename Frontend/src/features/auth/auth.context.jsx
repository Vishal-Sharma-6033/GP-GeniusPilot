import { createContext, useState } from "react";


export const AuthContext = createContext()


export const AuthProvider = ({ children }) => { 

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [credits, setCredits] = useState(0)
    const [subscriptionPlan, setSubscriptionPlan] = useState("free")
    const [subscriptionExpiry, setSubscriptionExpiry] = useState(null)

    const updateCredits = (newCredits) => {
        setCredits(newCredits)
        if (user) {
            setUser({ ...user, credits: newCredits })
        }
    }

    const updateSubscription = (plan, expiry) => {
        setSubscriptionPlan(plan)
        setSubscriptionExpiry(expiry)
        if (user) {
            setUser({ ...user, subscriptionPlan: plan, subscriptionExpiry: expiry })
        }
    }

    return (
        <AuthContext.Provider value={{ 
            user, setUser, loading, setLoading, 
            credits, setCredits, updateCredits,
            subscriptionPlan, setSubscriptionPlan,
            subscriptionExpiry, setSubscriptionExpiry,
            updateSubscription
        }} >
            {children}
        </AuthContext.Provider>
    )

    
}
