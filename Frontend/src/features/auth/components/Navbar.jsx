import React, { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import SubscriptionModal from '../../payment/components/SubscriptionModal'
import { Show, UserButton } from '@clerk/react-router'
import './Navbar.scss'

const Navbar = () => {
    const { user, credits, subscriptionPlan, updateSubscription } = useAuth()
    const [showSubscription, setShowSubscription] = useState(false)

    const onCreditsAdded = (newCredits, plan, expiry) => {
        updateSubscription(plan, expiry)
    }

    const isSubscribed = subscriptionPlan && subscriptionPlan !== "free"

    return (
        <>
            <header className="app-navbar">
                <div className="navbar-container">
                    <Link to="/" className="navbar-logo">
                        <span>Genius</span><span className="logo-alt">Pilot</span> 🚀
                    </Link>

                    <nav className="navbar-links">
                        <Link to="/" className="navbar-link">Dashboard</Link>
                        <Link to="/questions" className="navbar-link">Questions</Link>
                        <Link to="/profile" className="navbar-link">Profile</Link>
                    </nav>

                    <div className="navbar-auth-section">
                        <Show when="signed-out">
                            <Link to="/sign-in" className="login-btn-link">Sign In</Link>
                            <Link to="/sign-up" className="signup-btn-link">Sign Up</Link>
                        </Show>
                        <Show when="signed-in">
                            {user && (
                                <div className="navbar-user">
                                    {isSubscribed && (
                                        <span className={`plan-badge plan-badge--${subscriptionPlan}`}>
                                            {subscriptionPlan === "monthly" ? "Monthly" : "Yearly"}
                                        </span>
                                    )}
                                    <div className="credits-badge">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                                        <span>{credits}</span>
                                    </div>
                                    {!isSubscribed && (
                                        <button onClick={() => setShowSubscription(true)} className="upgrade-btn">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
                                            Upgrade
                                        </button>
                                    )}
                                    <UserButton />
                                </div>
                            )}
                        </Show>
                    </div>
                </div>
            </header>
            <SubscriptionModal 
                isOpen={showSubscription} 
                onClose={() => setShowSubscription(false)}
                onCreditsAdded={onCreditsAdded}
            />
        </>
    )
}

export default Navbar
