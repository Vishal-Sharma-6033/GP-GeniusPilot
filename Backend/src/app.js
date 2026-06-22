const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))

const authRouter = require("./features/auth/auth.routes")
const interviewRouter = require("./features/interview/interview.routes")
const paymentRouter = require("./features/payment/payment.routes")


app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)
app.use("/api/payment", paymentRouter)



module.exports = app