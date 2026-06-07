import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { useInterview } from '../../interview/hooks/useInterview'
import Navbar from '../components/Navbar'
import { useNavigate } from 'react-router'
import './Profile.scss'

const Profile = () => {
    const { user } = useAuth()
    const { reports } = useInterview()
    const navigate = useNavigate()

    if (!user) return null

    return (
        <div className="profile-page-wrapper">
            <Navbar />
            
            <main className="profile-container">
                <div className="profile-card">
                    <div className="profile-card__header">
                        <div className="avatar-large">
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                        <h2>{user.username}</h2>
                        <span className="profile-role">GeniusPilot User</span>
                    </div>

                    <div className="profile-card__body">
                        <h3>Account Details</h3>
                        <div className="details-grid">
                            <div className="detail-item">
                                <span className="detail-label">User ID</span>
                                <span className="detail-value text-mono">{user.id || user._id}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Username</span>
                                <span className="detail-value">{user.username}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Email Address</span>
                                <span className="detail-value">{user.email}</span>
                            </div>
                        </div>

                        <div className="profile-stats">
                            <h3>Platform Stats</h3>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <span className="stat-val">{reports ? reports.length : 0}</span>
                                    <span className="stat-lbl">Reports Generated</span>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-val">
                                        {reports && reports.length > 0 
                                            ? Math.max(...reports.map(r => r.matchScore || 0)) 
                                            : 0}%
                                    </span>
                                    <span className="stat-lbl">Highest Match Score</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="profile-card__footer">
                        <button onClick={() => navigate('/')} className="back-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Profile
