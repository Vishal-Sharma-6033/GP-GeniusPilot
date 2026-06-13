const orderModel = require("../models/order.model")
const userModel = require("../models/user.model")
const {
    createSubscriptionOrder,
    verifyPaymentSignature,
    getCreditsForPlan,
    getSubscriptionDurationMs
} = require("../services/razorpay.service")

/**
 * @name createOrderController
 * @description Create a Razorpay order for subscription
 * @body { plan: "monthly" | "yearly" }
 * @access Private
 */
async function createOrderController(req, res) {
    try {
        const { plan } = req.body

        if (!plan || !["monthly", "yearly"].includes(plan)) {
            return res.status(400).json({
                message: "Please provide a valid plan: 'monthly' or 'yearly'."
            })
        }

        const razorpayOrder = await createSubscriptionOrder({ plan })

        // Save order in database
        const order = await orderModel.create({
            user: req.user.id,
            razorpayOrderId: razorpayOrder.id,
            plan,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            status: "created"
        })

        res.status(201).json({
            message: "Order created successfully.",
            order: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                plan
            },
            keyId: process.env.RAZORPAY_KEY_ID
        })
    } catch (error) {
        console.error("Error in createOrderController:", error)
        res.status(500).json({
            message: "Failed to create order.",
            error: error.message
        })
    }
}

/**
 * @name verifyPaymentController
 * @description Verify Razorpay payment and update user credits
 * @body { razorpayOrderId, razorpayPaymentId, razorpaySignature, plan }
 * @access Private
 */
async function verifyPaymentController(req, res) {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, plan } = req.body

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !plan) {
            return res.status(400).json({
                message: "Missing payment verification details."
            })
        }

        // Verify signature
        const isValid = verifyPaymentSignature({
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        })

        if (!isValid) {
            // Mark order as failed
            await orderModel.findOneAndUpdate(
                { razorpayOrderId },
                { status: "failed" }
            )

            return res.status(400).json({
                message: "Payment verification failed. Invalid signature."
            })
        }

        // Update order in database
        const order = await orderModel.findOneAndUpdate(
            { razorpayOrderId, user: req.user.id },
            {
                razorpayPaymentId,
                razorpaySignature,
                status: "paid",
                creditsAdded: getCreditsForPlan(plan)
            },
            { new: true }
        )

        if (!order) {
            return res.status(404).json({
                message: "Order not found."
            })
        }

        // Update user credits and subscription
        const creditsToAdd = getCreditsForPlan(plan)
        const expiryDate = new Date(Date.now() + getSubscriptionDurationMs(plan))

        const user = await userModel.findByIdAndUpdate(
            req.user.id,
            {
                $inc: { credits: creditsToAdd },
                subscriptionPlan: plan,
                subscriptionExpiry: expiryDate
            },
            { new: true }
        )

        res.status(200).json({
            message: "Payment verified successfully. Credits added to your account.",
            credits: user.credits,
            subscriptionPlan: user.subscriptionPlan,
            subscriptionExpiry: user.subscriptionExpiry,
            creditsAdded: creditsToAdd
        })
    } catch (error) {
        console.error("Error in verifyPaymentController:", error)
        res.status(500).json({
            message: "Payment verification failed.",
            error: error.message
        })
    }
}

/**
 * @name getSubscriptionStatusController
 * @description Get current user's subscription status
 * @access Private
 */
async function getSubscriptionStatusController(req, res) {
    try {
        const user = await userModel.findById(req.user.id)

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            })
        }

        res.status(200).json({
            subscriptionPlan: user.subscriptionPlan,
            subscriptionExpiry: user.subscriptionExpiry,
            credits: user.credits
        })
    } catch (error) {
        console.error("Error in getSubscriptionStatusController:", error)
        res.status(500).json({
            message: "Failed to fetch subscription status."
        })
    }
}

module.exports = {
    createOrderController,
    verifyPaymentController,
    getSubscriptionStatusController
}