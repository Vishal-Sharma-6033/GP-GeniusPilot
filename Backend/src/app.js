import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))

import authRouter from "./features/auth/auth.routes.js"
import interviewRouter from "./features/interview/interview.routes.js"
import paymentRouter from "./features/payment/payment.routes.js"


app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)
app.use("/api/payment", paymentRouter)



export default app