/**
 * Question Bank Utilities
 * ────────────────────────
 * Helper functions for filtering, sorting, and computing stats
 * on the interview question bank. All functions are pure (no side effects).
 */

/**
 * Filter questions by search query and difficulty.
 * @param {Array}  questions  - Full list of question objects
 * @param {string} query      - Search string (matches question text, answer, intention)
 * @param {string} difficulty - 'All' | 'Easy' | 'Medium' | 'Hard'
 * @returns {Array} Filtered list
 */
export function filterQuestions(questions, query = '', difficulty = 'All') {
    const q = query.trim().toLowerCase()

    return questions.filter((item) => {
        const matchesDifficulty =
            difficulty === 'All' || item.difficulty === difficulty

        const matchesQuery =
            !q ||
            item.question.toLowerCase().includes(q) ||
            item.answer.toLowerCase().includes(q) ||
            item.intention.toLowerCase().includes(q)

        return matchesDifficulty && matchesQuery
    })
}

/**
 * Compute per-difficulty breakdown counts from a list of questions.
 * @param {Array} questions - Array of question objects
 * @returns {{ Easy: number, Medium: number, Hard: number }}
 */
export function getDifficultyBreakdown(questions) {
    return questions.reduce(
        (acc, item) => {
            if (acc[item.difficulty] !== undefined) {
                acc[item.difficulty]++
            }
            return acc
        },
        { Easy: 0, Medium: 0, Hard: 0 }
    )
}

/**
 * Count how many questions in a list have been reviewed.
 * @param {Array}  questions   - Array of question objects
 * @param {Object} reviewedMap - { [id]: boolean } map from localStorage
 * @returns {number} Count of reviewed questions
 */
export function countReviewed(questions, reviewedMap) {
    return questions.filter((q) => reviewedMap[q.id]).length
}

/**
 * Build a localStorage key for a given category.
 * @param {string} categoryId - e.g. 'javascript'
 * @returns {string} e.g. 'gp_reviewed_javascript'
 */
export function getStorageKey(categoryId) {
    return `gp_reviewed_${categoryId}`
}

/**
 * Load reviewed state from localStorage for a category.
 * @param {string} categoryId
 * @returns {Object} { [questionId]: boolean }
 */
export function loadReviewed(categoryId) {
    try {
        const raw = localStorage.getItem(getStorageKey(categoryId))
        return raw ? JSON.parse(raw) : {}
    } catch {
        return {}
    }
}

/**
 * Save reviewed state to localStorage for a category.
 * @param {string} categoryId
 * @param {Object} reviewedMap - { [questionId]: boolean }
 */
export function saveReviewed(categoryId, reviewedMap) {
    try {
        localStorage.setItem(getStorageKey(categoryId), JSON.stringify(reviewedMap))
    } catch {
        // localStorage may be unavailable in some environments
    }
}
