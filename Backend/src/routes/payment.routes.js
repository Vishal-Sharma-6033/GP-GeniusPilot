const { Router } = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const paymentController = require("../controllers/payment.controller")

const paymentRouter = Router()

/**
 * @route POST /api/payment/create-order
 * @description Create a Razorpay order for subscription
 * @body { plan: "monthly" | "yearly" }
 * @access Private
 */
paymentRouter.post("/create-order", authMiddleware.authUser, paymentController.createOrderController)

/**
 * @route POST /api/payment/verify
 * @description Verify Razorpay payment and add credits
 * @body { razorpayOrderId, razorpayPaymentId, razorpaySignature, plan }
 * @access Private
 */
paymentRouter.post("/verify", authMiddleware.authUser, paymentController.verifyPaymentController)

/**
 * @route GET /api/payment/subscription
 * @description Get current user subscription status
 * @access Private
 */
paymentRouter.get("/subscription", authMiddleware.authUser, paymentController.getSubscriptionStatusController)

module.exports = paymentRouter