const express = require("express")
const authMiddleware = require("../auth/auth.middleware")
const interviewController = require("./interview.controller")
const upload = require("./file.middleware")
const { createRateLimiter } = require("../../shared/middlewares/rateLimit.middleware")

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

module.exports = interviewRouter