import React, { useState, useEffect, useMemo } from 'react'
import Navbar from '../../auth/components/Navbar'
import { useAuth } from '../../auth/hooks/useAuth'
import { QUESTION_CATEGORIES } from '../data/jsQuestions'
import { filterQuestions } from '../utils/questionUtils'
import '../style/questions.scss'

// ── Constants ─────────────────────────────────────────────────────────────────
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard']

// ── Progress Ring SVG ─────────────────────────────────────────────────────────
const ProgressRing = ({ reviewed, total }) => {
    const radius = 38
    const circumference = 2 * Math.PI * radius
    const pct = total > 0 ? reviewed / total : 0
    const offset = circumference - pct * circumference

    return (
        <div className="qb-ring__wrap">
            <svg width="100" height="100" viewBox="0 0 100 100">
                <defs>
                    <linearGradient id="qb-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ff2d78" />
                        <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                </defs>
                <circle className="qb-ring__bg" cx="50" cy="50" r={radius} strokeWidth="7" />
                <circle
                    className="qb-ring__fill"
                    cx="50"
                    cy="50"
                    r={radius}
                    strokeWidth="7"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform="rotate(-90 50 50)"
                />
            </svg>
            <div className="qb-ring__center">
                <span className="qb-ring__value">{reviewed}</span>
                <span className="qb-ring__total">/ {total}</span>
            </div>
        </div>
    )
}

// ── Single Question Card ──────────────────────────────────────────────────────
const QuestionCard = ({ item, globalIndex, reviewed, onToggle }) => {
    const [open, setOpen] = useState(false)

    return (
        <div className={`qb-card ${reviewed ? 'qb-card--reviewed' : ''}`}>
            <div className="qb-card__header">
                {/* Checkbox */}
                <button
                    className={`qb-card__check ${reviewed ? 'qb-card__check--done' : ''}`}
                    onClick={(e) => { e.stopPropagation(); onToggle(item.id) }}
                    title={reviewed ? 'Mark as not reviewed' : 'Mark as reviewed'}
                    id={`qb-check-${item.id}`}
                >
                    {reviewed ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                        </svg>
                    )}
                </button>

                {/* Main row — clickable to expand */}
                <div className="qb-card__header-text" onClick={() => setOpen(o => !o)}>
                    <span className="qb-card__index">Q{globalIndex + 1}</span>
                    <p className="qb-card__question">{item.question}</p>
                    <div className="qb-card__meta">
                        <span className={`qb-card__diff qb-card__diff--${item.difficulty}`}>
                            {item.difficulty}
                        </span>
                        <span className={`qb-card__chevron ${open ? 'qb-card__chevron--open' : ''}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </span>
                    </div>
                </div>
            </div>

            {open && (
                <div className="qb-card__body">
                    {item.intention && (
                        <div className="qb-card__section">
                            <span className="qb-card__tag qb-card__tag--intention">Why Interviewers Ask</span>
                            <p>{item.intention}</p>
                        </div>
                    )}
                    <div className="qb-card__section">
                        <span className="qb-card__tag qb-card__tag--answer">Model Answer</span>
                        <p>{item.answer}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
const InterviewQuestions = () => {
    const { user } = useAuth()

    // Active category tab
    const [activeCategory, setActiveCategory] = useState(QUESTION_CATEGORIES[0].id)
    // Search input
    const [searchQuery, setSearchQuery] = useState('')
    // Difficulty filter
    const [diffFilter, setDiffFilter] = useState('All')
    // Reviewed state: Set of question ids that are checked
    const [reviewed, setReviewed] = useState(new Set())

    // ── localStorage key (per user, per category) ──────────────────────────
    const storageKey = user
        ? `gp_questions_progress_${user._id}_${activeCategory}`
        : null

    // Load progress from localStorage when category or user changes
    useEffect(() => {
        if (!storageKey) return
        try {
            const saved = localStorage.getItem(storageKey)
            if (saved) {
                setReviewed(new Set(JSON.parse(saved)))
            } else {
                setReviewed(new Set())
            }
        } catch {
            setReviewed(new Set())
        }
    }, [storageKey])

    // Save progress to localStorage whenever reviewed changes
    useEffect(() => {
        if (!storageKey) return
        try {
            localStorage.setItem(storageKey, JSON.stringify([...reviewed]))
        } catch {
            // storage quota exceeded or unavailable — fail silently
        }
    }, [reviewed, storageKey])

    // ── Toggle a question's reviewed state ─────────────────────────────────
    const handleToggle = (id) => {
        setReviewed(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    // ── Reset all progress for the current category ────────────────────────
    const handleResetProgress = () => {
        if (!window.confirm(`Reset all progress for ${currentCategory?.label ?? 'this topic'}? This cannot be undone.`)) return
        setReviewed(new Set())
        if (storageKey) {
            try { localStorage.removeItem(storageKey) } catch { /* ignore */ }
        }
    }

    // ── Current category data ──────────────────────────────────────────────
    const currentCategory = QUESTION_CATEGORIES.find(c => c.id === activeCategory)
    const allQuestions = currentCategory?.questions ?? []

    // ── Filtered questions ─────────────────────────────────────────────────
    const filteredQuestions = useMemo(() => {
        return filterQuestions(allQuestions, searchQuery, diffFilter)
    }, [allQuestions, searchQuery, diffFilter])

    // ── Difficulty breakdown for sidebar ───────────────────────────────────
    const breakdown = useMemo(() => {
        return ['Easy', 'Medium', 'Hard'].map(d => ({
            label: d,
            total: allQuestions.filter(q => q.difficulty === d).length,
            done: allQuestions.filter(q => q.difficulty === d && reviewed.has(q.id)).length,
        }))
    }, [allQuestions, reviewed])

    const totalReviewed = allQuestions.filter(q => reviewed.has(q.id)).length
    const pct = allQuestions.length > 0 ? Math.round((totalReviewed / allQuestions.length) * 100) : 0

    return (
        <div className="qb-page-wrapper">
            <Navbar />
            <div className="qb-page">
                <div className="qb-layout">

                    {/* ── Left Nav ── */}
                    <nav className="qb-nav">
                        <p className="qb-nav__label">Topics</p>

                        {/* Active categories */}
                        {QUESTION_CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                id={`qb-nav-${cat.id}`}
                                className={`qb-nav__item ${activeCategory === cat.id ? 'qb-nav__item--active' : ''}`}
                                onClick={() => { setActiveCategory(cat.id); setSearchQuery(''); setDiffFilter('All') }}
                            >
                                <span
                                    className="qb-nav__icon"
                                    style={activeCategory === cat.id ? { color: cat.color } : {}}
                                >
                                    {cat.icon}
                                </span>
                                {cat.label}
                                <span className="qb-nav__badge">{cat.questions.length}</span>
                            </button>
                        ))}

                        {/* Coming soon placeholders */}
                        {/* {[
                            { id: 'dsa', label: 'DSA', icon: '∑' },
                        ].map(cat => (
                            <div key={cat.id} className="qb-nav__coming-soon" title="Coming soon">
                                <span className="qb-nav__icon">{cat.icon}</span>
                                {cat.label}
                                <span className="qb-nav__badge">Soon</span>
                            </div>
                        ))} */}
                    </nav>

                    <div className="qb-divider" />

                    {/* ── Center Content ── */}
                    <main className="qb-content">
                        {/* Header */}
                        <div className="qb-header">
                            <h2>{currentCategory?.label} Questions</h2>
                            <span className="qb-header__count">{filteredQuestions.length} questions</span>
                        </div>

                        {/* Progress bar */}
                        <div className="qb-progress-wrap">
                            <div className="qb-progress-bar">
                                <div
                                    className="qb-progress-bar__fill"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <span className="qb-progress-bar__label">{totalReviewed}/{allQuestions.length} reviewed</span>
                        </div>

                        {/* Search + filter */}
                        <div className="qb-controls">
                            <div className="qb-search">
                                <span className="qb-search__icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                </span>
                                <input
                                    id="qb-search-input"
                                    type="text"
                                    placeholder="Search questions…"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="qb-filters">
                                {DIFFICULTIES.map(d => (
                                    <button
                                        key={d}
                                        id={`qb-filter-${d.toLowerCase()}`}
                                        className={`qb-filter-pill qb-filter-pill--${d.toLowerCase()} ${diffFilter === d ? 'qb-filter-pill--active' : ''}`}
                                        onClick={() => setDiffFilter(d)}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Question cards — only this wrapper scrolls */}
                        <div className="qb-list-wrap">
                            {filteredQuestions.length === 0 ? (
                                <div className="qb-empty">
                                    <span>🔍</span>
                                    No questions match your search or filter.
                                </div>
                            ) : (
                                <div className="qb-list">
                                    {filteredQuestions.map((q, i) => (
                                        <QuestionCard
                                            key={q.id}
                                            item={q}
                                            globalIndex={i}
                                            reviewed={reviewed.has(q.id)}
                                            onToggle={handleToggle}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </main>

                    <div className="qb-divider" />

                    {/* ── Right Sidebar ── */}
                    <aside className="qb-sidebar">
                        {/* Progress Ring */}
                        <div className="qb-ring">
                            <p className="qb-ring__label">Progress</p>
                            <ProgressRing reviewed={totalReviewed} total={allQuestions.length} />
                            <p className="qb-ring__sub">
                                {pct === 100
                                    ? '🎉 All reviewed!'
                                    : pct >= 50
                                        ? `${pct}% complete — keep going!`
                                        : `${pct}% complete`}
                            </p>
                            {totalReviewed > 0 && (
                                <button
                                    id="qb-reset-btn"
                                    className="qb-reset-btn"
                                    onClick={handleResetProgress}
                                    title="Reset progress for this topic"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="1 4 1 10 7 10" />
                                        <path d="M3.51 15a9 9 0 1 0 .49-3.29" />
                                    </svg>
                                    Reset Progress
                                </button>
                            )}
                        </div>

                        <div className="qb-sidebar-divider" />

                        {/* Difficulty Breakdown */}
                        <div className="qb-breakdown">
                            <p className="qb-breakdown__label">By Difficulty</p>
                            <div className="qb-breakdown__list">
                                {breakdown.map(b => (
                                    <div key={b.label} className="qb-breakdown__row">
                                        <span className={`qb-breakdown__dot qb-breakdown__dot--${b.label}`} />
                                        <span className="qb-breakdown__name">{b.label}</span>
                                        <span className="qb-breakdown__counts">
                                            {b.done}/{b.total}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="qb-sidebar-divider" />

                        {/* Tips */}
                        {/* <div className="qb-tips">
                            <p className="qb-tips__label">Tips</p>
                            <div className="qb-tips__item">
                                <span>✅</span>
                                <span>Check off questions after you can answer them confidently</span>
                            </div>
                            <div className="qb-tips__item">
                                <span>🔍</span>
                                <span>Use search to quickly find specific topics</span>
                            </div>
                            <div className="qb-tips__item">
                                <span>🔁</span>
                                <span>Revisit Hard questions at least 3 times before your interview</span>
                            </div>
                        </div> */}
                    </aside>

                </div>
            </div>
        </div>
    )
}

export default InterviewQuestions
