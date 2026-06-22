import React, { useState, useEffect } from 'react';
import './loading.scss';

const INTERVIEW_TIPS = [
    "Use the STAR method (Situation, Task, Action, Result) to structure your behavioral answers.",
    "Always ask clarifying questions about constraints before jumping into code solutions.",
    "Review the skill gaps section to prioritize what topics to study first.",
    "Marking questions as completed updates your progress bar and keeps you on track.",
    "Be prepared to explain the runtime (Big O) complexity of your code solutions.",
    "For system design questions, clarify requirements and establish clear scale estimates first."
];

export default function LoadingScreen({ type = "spinner", message = "Loading..." }) {
    const [progress, setProgress] = useState(0);
    const [tipIndex, setTipIndex] = useState(0);

    // Dynamic progress counter (for simulated percentage mode)
    useEffect(() => {
        if (type !== 'percentage') return;

        setProgress(0);
        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 99) return 99; // Cap at 99% until loading state completes
                
                // Slow down progress updates as it approaches 100% to remain realistic
                let increment = 0;
                if (prev < 40) {
                    increment = Math.floor(Math.random() * 8) + 3; // +3% to +10%
                } else if (prev < 75) {
                    increment = Math.floor(Math.random() * 5) + 2; // +2% to +6%
                } else if (prev < 90) {
                    increment = Math.floor(Math.random() * 3) + 1; // +1% to +3%
                } else {
                    increment = Math.random() > 0.6 ? 1 : 0; // +0% or +1%
                }

                const next = prev + increment;
                return next >= 100 ? 99 : next;
            });
        }, 300);

        return () => clearInterval(timer);
    }, [type]);

    // Rotate tips every 3.5 seconds
    useEffect(() => {
        if (type !== 'percentage') return;

        const tipTimer = setInterval(() => {
            setTipIndex((prev) => (prev + 1) % INTERVIEW_TIPS.length);
        }, 3500);

        return () => clearInterval(tipTimer);
    }, [type]);

    // Circumference of SVG circle (radius = 36, so 2 * PI * 36 = 226.2)
    const strokeWidth = 5;
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <main className="loading-screen-container">
            <div className="loading-content-box">
                <div className="progress-indicator-wrapper">
                    {type === 'percentage' ? (
                        <div className="circular-progress-svg-wrapper">
                            <svg className="circular-progress-svg" viewBox="0 0 80 80">
                                <circle 
                                    className="circular-progress-bg" 
                                    cx="40" 
                                    cy="40" 
                                    r={radius} 
                                    strokeWidth={strokeWidth} 
                                />
                                <circle 
                                    className="circular-progress-fg" 
                                    cx="40" 
                                    cy="40" 
                                    r={radius} 
                                    strokeWidth={strokeWidth} 
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                />
                            </svg>
                            <span className="progress-text">{progress}%</span>
                        </div>
                    ) : (
                        <div className="spinner-loader" />
                    )}
                </div>

                <h1 className="loading-message">{message}</h1>

                {type === 'percentage' && (
                    <div className="loading-tips-carousel">
                        <div className="tips-carousel-header">
                            <span className="tips-icon">💡</span>
                            <span className="tips-label">Interview Prep Tip</span>
                        </div>
                        <p className="tips-content">{INTERVIEW_TIPS[tipIndex]}</p>
                    </div>
                )}
            </div>
        </main>
    );
}
