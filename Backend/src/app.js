import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}))

import authRouter from "./features/auth/auth.routes.js"
import interviewRouter from "./features/interview/interview.routes.js"
import paymentRouter from "./features/payment/payment.routes.js"


app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)
app.use("/api/payment", paymentRouter)

app.use((err, req, res, next) => {
    console.error("Unhandled error:", err)
    res.status(500).json({
        message: "An internal server error occurred."
    })
})

export default app