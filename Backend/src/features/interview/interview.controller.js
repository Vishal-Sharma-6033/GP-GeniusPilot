import { PDFParse } from "pdf-parse"
import { generateInterviewReport, generateResumePdf } from "./ai.service.js"
import interviewReportModel from "./interviewReport.model.js"
import userModel from "../auth/user.model.js"



async function generateInterViewReportController(req, res) {
    try {
        const { selfDescription, jobDescription } = req.body

        let resumeText = ""
        if (req.file) {
            let parser = null
            try {
                parser = new PDFParse({ data: req.file.buffer })
                const parsedPdf = await parser.getText()
                resumeText = parsedPdf.text || ""
            } catch (err) {
                console.error("PDF parse error:", err)
                return res.status(400).json({
                    message: "Failed to parse the uploaded resume PDF."
                })
            } finally {
                if (parser) {
                    await parser.destroy()
                }
            }
        }

        if (!resumeText && !selfDescription) {
            return res.status(400).json({
                message: "Please upload a resume or provide a self-description."
            })
        }

        if (!jobDescription) {
            return res.status(400).json({
                message: "Job description is required."
            })
        }

        // Atomically reserve one credit. Only succeeds if the user still has
        // credits, which prevents a concurrent double-spend race.
        const user = await userModel.findOneAndUpdate(
            { _id: req.user.id, credits: { $gt: 0 } },
            { $inc: { credits: -1 } },
            { returnDocument: "after" }
        )

        if (!user) {
            return res.status(403).json({
                message: "You have no free credits remaining. Each generation uses 1 credit."
            })
        }

        let interviewReport
        try {
            const interViewReportByAi = await generateInterviewReport({
                resume: resumeText,
                selfDescription,
                jobDescription
            })

            const techCount = (interViewReportByAi.technicalQuestions || []).length
            const behCount = (interViewReportByAi.behavioralQuestions || []).length

            interviewReport = await interviewReportModel.create({
                user: req.user.id,
                resume: resumeText,
                selfDescription,
                jobDescription,
                ...interViewReportByAi,
                technicalProgress: Array(techCount).fill(false),
                behavioralProgress: Array(behCount).fill(false)
            })
        } catch (genErr) {
            // Refund the reserved credit if generation or persistence failed.
            await userModel.updateOne({ _id: req.user.id }, { $inc: { credits: 1 } })
            throw genErr
        }

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport,
            creditsRemaining: user.credits
        })
    } catch (error) {
        console.error("Error in generateInterViewReportController:", error)
        res.status(500).json({
            message: "An internal server error occurred while generating the interview report.",
            error: error.message
        })
    }
}


async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}



async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}



async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        const interviewReport = await interviewReportModel.findOne({
            _id: interviewReportId,
            user: req.user.id
        })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        res.send(pdfBuffer)
    } catch (error) {
        console.error("Error in generateResumePdfController:", error)
        res.status(500).json({
            message: "Failed to generate resume PDF.",
            error: error.message
        })
    }
}


async function deleteInterviewReportController(req, res) {
    try {
        const { interviewId } = req.params

        const interviewReport = await interviewReportModel.findOneAndDelete({
            _id: interviewId,
            user: req.user.id
        })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview plan not found or unauthorized."
            })
        }

        res.status(200).json({
            message: "Interview plan deleted successfully."
        })
    } catch (error) {
        console.error("Error in deleteInterviewReportController:", error)
        res.status(500).json({
            message: "Failed to delete interview plan.",
            error: error.message
        })
    }
}


async function updateProgressController(req, res) {
    try {
        const { interviewId } = req.params
        const { type, progress } = req.body

        if (type !== 'technical' && type !== 'behavioral') {
            return res.status(400).json({
                message: "Please provide 'type' as either 'technical' or 'behavioral'."
            })
        }

        if (!Array.isArray(progress) || !progress.every(p => typeof p === 'boolean')) {
            return res.status(400).json({
                message: "Please provide 'progress' as an array of booleans."
            })
        }

        const field = type === 'technical' ? 'technicalProgress' : 'behavioralProgress'

        const interviewReport = await interviewReportModel.findOneAndUpdate(
            { _id: interviewId, user: req.user.id },
            { [field]: progress },
            { returnDocument: "after" }
        )

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        res.status(200).json({
            message: "Progress updated successfully.",
            [field]: progress
        })
    } catch (error) {
        console.error("Error in updateProgressController:", error)
        res.status(500).json({
            message: "Failed to update progress.",
            error: error.message
        })
    }
}

export {
    generateInterViewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController,
    deleteInterviewReportController,
    updateProgressController
}