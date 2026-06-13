import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe } from "../services/auth.api";



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

    useEffect(() => {

        const getAndSetUser = async () => {
            try {

                const data = await getMe()
                setUser(data.user)
                setCredits(data.user.credits)
                setSubscriptionPlan(data.user.subscriptionPlan || "free")
                setSubscriptionExpiry(data.user.subscriptionExpiry || null)
            } catch (err) { } finally {
                setLoading(false)
            }
        }

        getAndSetUser()

    }, [])

    return { 
        user, loading, credits, 
        subscriptionPlan, subscriptionExpiry,
        handleRegister, handleLogin, handleLogout, 
        updateCredits, updateSubscription 
    }
}
