import orderModel from "./order.model.js"
import userModel from "../auth/user.model.js"
import {
    createSubscriptionOrder,
    verifyPaymentSignature,
    getCreditsForPlan,
    getSubscriptionDurationMs
} from "./razorpay.service.js"


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

async function verifyPaymentController(req, res) {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
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
            // Mark order as failed (only while still pending, so a paid order is never flipped)
            await orderModel.findOneAndUpdate(
                { razorpayOrderId, status: "created" },
                { status: "failed" }
            )

            return res.status(400).json({
                message: "Payment verification failed. Invalid signature."
            })
        }

        // The plan is taken from the stored order, never from the client, so a
        // user cannot pay for a cheaper plan and claim a more expensive one.
        // Matching status: "created" makes this idempotent: a replayed request
        // finds no pending order, so credits are never granted twice.
        const order = await orderModel.findOneAndUpdate(
            { razorpayOrderId, user: req.user.id, status: "created" },
            {
                razorpayPaymentId,
                razorpaySignature,
                status: "paid"
            },
            { returnDocument: "after" }
        )

        if (!order) {
            // Either the order doesn't exist for this user, or it was already processed.
            return res.status(409).json({
                message: "Order not found or has already been processed."
            })
        }

        // Update user credits and subscription
        const plan = order.plan
        const creditsToAdd = getCreditsForPlan(plan)
        const expiryDate = new Date(Date.now() + getSubscriptionDurationMs(plan))

        order.creditsAdded = creditsToAdd
        await order.save()

        const user = await userModel.findByIdAndUpdate(
            req.user.id,
            {
                $inc: { credits: creditsToAdd },
                subscriptionPlan: plan,
                subscriptionExpiry: expiryDate
            },
            { returnDocument: "after" }
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

export {
    createOrderController,
    verifyPaymentController,
    getSubscriptionStatusController
}