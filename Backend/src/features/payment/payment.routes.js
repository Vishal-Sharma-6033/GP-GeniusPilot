import { Router } from "express"
import * as authMiddleware from "../auth/auth.middleware.js"
import * as paymentController from "./payment.controller.js"

const paymentRouter = Router()


paymentRouter.post("/create-order", authMiddleware.authUser, paymentController.createOrderController)


paymentRouter.post("/verify", authMiddleware.authUser, paymentController.verifyPaymentController)


paymentRouter.get("/subscription", authMiddleware.authUser, paymentController.getSubscriptionStatusController)

export default paymentRouter