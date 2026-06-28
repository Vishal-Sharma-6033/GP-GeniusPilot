import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe, clerkSync } from "../services/auth.api";
import { useUser } from "@clerk/react-router";



export const useAuth = () => {

    const context = useContext(AuthContext)
    const { 
        user, setUser, loading, setLoading, 
        credits, setCredits, updateCredits,
        subscriptionPlan, setSubscriptionPlan,
        subscriptionExpiry, setSubscriptionExpiry,
        updateSubscription
    } = context


    const handleLogin = async ({ email, password }) => {
        setLoading(true)
        try {
            const data = await login({ email, password })
            setUser(data.user)
            setCredits(data.user.credits)
            setSubscriptionPlan(data.user.subscriptionPlan || "free")
            setSubscriptionExpiry(data.user.subscriptionExpiry || null)
        } catch (err) {

        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true)
        try {
            const data = await register({ username, email, password })
            setUser(data.user)
            setCredits(data.user.credits)
            setSubscriptionPlan(data.user.subscriptionPlan || "free")
            setSubscriptionExpiry(data.user.subscriptionExpiry || null)
        } catch (err) {

        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            const data = await logout()
            setUser(null)
            setCredits(0)
            setSubscriptionPlan("free")
            setSubscriptionExpiry(null)
        } catch (err) {

        } finally {
            setLoading(false)
        }
    }

    const { isLoaded, isSignedIn, user: clerkUser } = useUser()

    useEffect(() => {
        if (!isLoaded) return

        const syncClerkUser = async () => {
            if (isSignedIn && clerkUser) {
                const email = clerkUser.primaryEmailAddress?.emailAddress
                const username = clerkUser.username || clerkUser.firstName || email.split('@')[0]
                
                try {
                    const data = await clerkSync({ email, username })
                    setUser(data.user)
                    setCredits(data.user.credits)
                    setSubscriptionPlan(data.user.subscriptionPlan || "free")
                    setSubscriptionExpiry(data.user.subscriptionExpiry || null)
                } catch (err) {
                    console.error("Clerk sync error:", err)
                } finally {
                    setLoading(false)
                }
            } else {
                setUser(null)
                setCredits(0)
                setSubscriptionPlan("free")
                setSubscriptionExpiry(null)
                setLoading(false)
            }
        }

        syncClerkUser()

    }, [isLoaded, isSignedIn, clerkUser])

    return { 
        user, loading, credits, 
        subscriptionPlan, subscriptionExpiry,
        handleRegister, handleLogin, handleLogout, 
        updateCredits, updateSubscription,
        isClerkSignedIn: isSignedIn
    }
}
