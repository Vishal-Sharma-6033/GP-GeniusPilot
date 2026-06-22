import express from "express"
import * as authMiddleware from "../auth/auth.middleware.js"
import * as interviewController from "./interview.controller.js"
import upload from "./file.middleware.js"
import { createRateLimiter } from "../../shared/middlewares/rateLimit.middleware.js"

const interviewRouter = express.Router()

const generateLimiter = createRateLimiter({
    keyPrefix: "rl:gen",
    windowSeconds: 60,
    max: 5,
    message: "You're generating reports too quickly. Please wait a minute and try again."
})

// The resume-PDF endpoint runs a full OpenAI call + Puppeteer render on every
// request, so it must be throttled to prevent cost-abuse from a single user.
const resumePdfLimiter = createRateLimiter({
    keyPrefix: "rl:pdf",
    windowSeconds: 60,
    max: 5,
    message: "You're generating resume PDFs too quickly. Please wait a minute and try again."
})



interviewRouter.post("/", authMiddleware.authUser, generateLimiter, upload.single("resume"), interviewController.generateInterViewReportController)


interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController)



interviewRouter.put("/report/:interviewId/progress", authMiddleware.authUser, interviewController.updateProgressController)


interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController)



interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware.authUser, resumePdfLimiter, interviewController.generateResumePdfController)


interviewRouter.delete("/:interviewId", authMiddleware.authUser, interviewController.deleteInterviewReportController)

export default interviewRouter