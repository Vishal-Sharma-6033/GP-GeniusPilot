import React from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import './Navbar.scss'

const Navbar = () => {
    const { user, handleLogout } = useAuth()
    const navigate = useNavigate()

    const onLogout = async () => {
        await handleLogout()
        navigate('/login')
    }

    return (
        <header className="app-navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    <span>Genius</span><span className="logo-alt">Pilot</span> 🚀
                </Link>

                <nav className="navbar-links">
                    <Link to="/" className="navbar-link">Dashboard</Link>
                    <Link to="/profile" className="navbar-link">Profile</Link>
                </nav>

                {user && (
                    <div className="navbar-user">
                        <div className="user-info">
                            <span className="user-avatar">{user.username.charAt(0).toUpperCase()}</span>
                            <span className="user-name">{user.username}</span>
                        </div>
                        <button onClick={onLogout} className="logout-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </header>
    )
}

export default Navbar
