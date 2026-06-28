import { describe, it, expect } from "vitest"
import { filterQuestions, getDifficultyBreakdown, countReviewed } from "../questionUtils"

const MOCK_QUESTIONS = [
    { id: "q1", question: "What is closure?", difficulty: "Medium", answer: "A closure is...", intention: "Tests scope" },
    { id: "q2", question: "What is hoisting?", difficulty: "Easy", answer: "Hoisting is...", intention: "Tests execution" },
    { id: "q3", question: "What is event loop?", difficulty: "Hard", answer: "Event loop is...", intention: "Tests async" },
]

describe("filterQuestions", () => {
    it("returns all questions with no filters", () => {
        expect(filterQuestions(MOCK_QUESTIONS, "", "All")).toHaveLength(3)
    })

    it("filters by difficulty", () => {
        expect(filterQuestions(MOCK_QUESTIONS, "", "Easy")).toHaveLength(1)
        expect(filterQuestions(MOCK_QUESTIONS, "", "Hard")).toHaveLength(1)
        expect(filterQuestions(MOCK_QUESTIONS, "", "Medium")).toHaveLength(1)
    })

    it("filters by search query", () => {
        expect(filterQuestions(MOCK_QUESTIONS, "closure", "All")).toHaveLength(1)
        expect(filterQuestions(MOCK_QUESTIONS, "what", "All")).toHaveLength(3)
    })

    it("filters by both query and difficulty", () => {
        expect(filterQuestions(MOCK_QUESTIONS, "what", "Easy")).toHaveLength(1)
        expect(filterQuestions(MOCK_QUESTIONS, "closure", "Easy")).toHaveLength(0)
    })
})

describe("getDifficultyBreakdown", () => {
    it("counts questions per difficulty", () => {
        const breakdown = getDifficultyBreakdown(MOCK_QUESTIONS)
        expect(breakdown.Easy).toBe(1)
        expect(breakdown.Medium).toBe(1)
        expect(breakdown.Hard).toBe(1)
    })

    it("returns zeros for empty input", () => {
        const breakdown = getDifficultyBreakdown([])
        expect(breakdown).toEqual({ Easy: 0, Medium: 0, Hard: 0 })
    })
})

describe("countReviewed", () => {
    it("counts reviewed questions", () => {
        const reviewedMap = { q1: true, q2: false }
        expect(countReviewed(MOCK_QUESTIONS, reviewedMap)).toBe(1)
    })

    it("returns 0 when none reviewed", () => {
        expect(countReviewed(MOCK_QUESTIONS, {})).toBe(0)
    })
})
