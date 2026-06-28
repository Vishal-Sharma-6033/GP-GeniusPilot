import OpenAI from "openai"
import { z } from "zod"
import { zodToJsonSchema } from "zod-to-json-schema"
import puppeteer from "puppeteer"

let client = null

function getOpenAIClient() {
    if (client) {
        return client
    }

    const apiKey = process.env.OPENAI_API_KEY
    const baseURL = process.env.OPENAI_BASE_URL

    if (!apiKey) {
        throw new Error("OPENAI_API_KEY is missing. Add it to Backend/.env before using AI features.")
    }

    client = new OpenAI({
        apiKey,
        baseURL: baseURL || undefined
    })
    return client
}


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).min(10).describe("Technical questions that can be asked in the interview along with their intention and how to answer them. You must generate at least 10 questions."),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The behavioral question that can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).min(10).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them. You must generate at least 10 questions."),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).min(15).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively. You must generate at least 15 days."),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

function extractJson(text) {
    text = text.trim()

    text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()

    const firstBrace = text.indexOf('{')
    const lastBrace = text.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1) {
        text = text.slice(firstBrace, lastBrace + 1)
    }

    return text
}

function repairJson(text) {
    text = text.replace(/,(\s*[}\]])/g, '$1')

    text = text.replace(/\/\/.*$/gm, '')
    text = text.replace(/\/\*[\s\S]*?\*\//g, '')

    text = text.replace(/(?<=:\s*)'([^']*)'(?=\s*[,}\]])/g, '"$1"')
    text = text.replace(/(?<=[{,]\s*)'([^']*)'(?=\s*:)/g, '"$1"')

    text = text.replace(/(?<=:"[^"]*?)"(?=[^"]*?")/g, '\\"')

    return text
}

async function callModelForJson({ prompt, schema, schemaName }) {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini"
    const openai = getOpenAIClient()

    const jsonSchema = zodToJsonSchema(schema, schemaName)
    const systemPrompt = `You are a helpful assistant. You must output ONLY a valid JSON object matching this JSON Schema (do not include any conversational text, markdown code blocks, or explanations):
${JSON.stringify(jsonSchema, null, 2)}`

    const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
    ]

    const attempts = 3
    for (let i = 0; i < attempts; i++) {
        try {
            const response = await openai.chat.completions.create({
                model,
                response_format: { type: "json_object" },
                messages,
                temperature: i === 0 ? 0.0 : 0.2
            })

            const rawText = response.choices[0].message.content || ''
            const text = extractJson(rawText)

            let parsed = null
            let lastError = null

            for (const attempt of [
                (t) => JSON.parse(t),
                (t) => JSON.parse(repairJson(t)),
            ]) {
                try {
                    parsed = attempt(text)
                    break
                } catch (err) {
                    lastError = err
                }
            }

            if (!parsed) {
                if (i === attempts - 1) {
                    const errObj = new Error('Model output is not valid JSON')
                    errObj.raw = rawText
                    errObj.parseError = lastError ? lastError.message : 'Unknown'
                    throw errObj
                }
                messages.push({ role: "assistant", content: rawText })
                messages.push({ role: "user", content: `The response was not valid JSON. Error: ${lastError ? lastError.message : 'Parse error'}. Please output a valid JSON object matching the schema.` })
                continue
            }

            try {
                return schema.parse(parsed)
            } catch (err) {
                if (i === attempts - 1) {
                    const errObj = new Error('Model output does not match expected schema')
                    errObj.raw = rawText
                    errObj.parseError = err.message
                    throw errObj
                }
                const zodErrors = err.errors ? err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') : err.message
                messages.push({ role: "assistant", content: rawText })
                messages.push({
                    role: "user",
                    content: `The JSON output did not match the expected schema. Errors:\n${zodErrors}\n\nPlease correct the output. Ensure arrays have at least the minimum required number of elements (e.g., at least 10 items in 'technicalQuestions', at least 10 items in 'behavioralQuestions', and at least 15 items in 'preparationPlan').`
                })
            }
        } catch (error) {
            if (i === attempts - 1) {
                throw error
            }
        }
    }
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const prompt = `Generate an interview report for a candidate with the following details:
Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}

Strict Requirements:
1. You MUST generate at least 10 unique, relevant technical questions tailored to the candidate's gaps and the job description.
2. You MUST generate at least 10 unique, relevant behavioral questions.
3. You MUST generate a comprehensive preparation roadmap with a minimum of 15 days (Day 1 to Day 15 or more). Do not skip days.`

    return await callModelForJson({ prompt, schema: interviewReportSchema, schemaName: "interview_report" })
}

async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    })
    try {
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: "networkidle0" })

        const pdfBuffer = await page.pdf({
            format: "A4", margin: {
                top: "20mm",
                bottom: "20mm",
                left: "15mm",
                right: "15mm"
            }
        })

        return pdfBuffer
    } finally {
        await browser.close()
    }
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:\nResume: ${resume}\nSelf Description: ${selfDescription}\nJob Description: ${jobDescription}\n\nReturn a JSON object with a single field \"html\" containing the HTML string.`

    const jsonContent = await callModelForJson({ prompt, schema: resumePdfSchema, schemaName: "resume_pdf" })

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer
}

export { generateInterviewReport, generateResumePdf, extractJson, repairJson }