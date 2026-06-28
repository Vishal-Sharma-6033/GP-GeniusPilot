import { describe, it, expect } from "vitest"
import { extractJson, repairJson } from "../src/features/interview/ai.service.js"

describe("extractJson", () => {
    it("extracts JSON from a plain JSON string", () => {
        const input = '{"key": "value"}'
        expect(extractJson(input)).toBe(input)
    })

    it("strips markdown code fences", () => {
        const input = '```json\n{"key": "value"}\n```'
        expect(extractJson(input)).toBe('{"key": "value"}')
    })

    it("strips markdown without json label", () => {
        const input = '```\n{"key": "value"}\n```'
        expect(extractJson(input)).toBe('{"key": "value"}')
    })

    it("extracts JSON when wrapped in extra text", () => {
        const input = 'Here is the result: {"key": "value"} Hope that helps!'
        expect(extractJson(input)).toBe('{"key": "value"}')
    })

    it("returns the original text when no JSON braces found", () => {
        expect(extractJson("no json here")).toBe("no json here")
    })
})

describe("repairJson", () => {
    it("removes trailing commas", () => {
        const input = '{"a": 1, "b": 2,}'
        expect(repairJson(input)).toBe('{"a": 1, "b": 2}')
    })

    it("replaces single quotes with double quotes around keys", () => {
        const input = "{'key': 'value'}"
        expect(repairJson(input)).toBe('{"key": "value"}')
    })

    it("removes single-line comments", () => {
        const input = '{"a": 1 // comment\n}'
        expect(repairJson(input)).toBe('{"a": 1 \n}')
    })

    it("removes multi-line comments", () => {
        const input = '{"a": 1 /* comment */, "b": 2}'
        expect(repairJson(input)).toBe('{"a": 1 , "b": 2}')
    })
})
