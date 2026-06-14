const { Router } = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const paymentController = require("../controllers/payment.controller")

const paymentRouter = Router()


paymentRouter.post("/create-order", authMiddleware.authUser, paymentController.createOrderController)


paymentRouter.post("/verify", authMiddleware.authUser, paymentController.verifyPaymentController)


paymentRouter.get("/subscription", authMiddleware.authUser, paymentController.getSubscriptionStatusController)

module.exports = paymentRouter