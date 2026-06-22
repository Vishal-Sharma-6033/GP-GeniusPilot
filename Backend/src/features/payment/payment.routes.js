const { Router } = require("express")
const authMiddleware = require("../auth/auth.middleware")
const paymentController = require("./payment.controller")

const paymentRouter = Router()


paymentRouter.post("/create-order", authMiddleware.authUser, paymentController.createOrderController)


paymentRouter.post("/verify", authMiddleware.authUser, paymentController.verifyPaymentController)


paymentRouter.get("/subscription", authMiddleware.authUser, paymentController.getSubscriptionStatusController)

module.exports = paymentRouter