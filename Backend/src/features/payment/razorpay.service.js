const Razorpay = require("razorpay")
const crypto = require("crypto")

let instance = null

function getRazorpayInstance() {
    if (instance) {
        return instance
    }

    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
        throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env")
    }

    instance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
    })

    return instance
}


async function createSubscriptionOrder({ plan }) {
    const razorpay = getRazorpayInstance()

    const amount = plan === "monthly" ? 39900 : 299900 // 399 INR or 2999 INR in paise
    const currency = "INR"

    const options = {
        amount,
        currency,
        receipt: `receipt_${Date.now()}`,
        notes: {
            plan
        }
    }

    const order = await razorpay.orders.create(options)

    return order
}


function verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex")

    return expectedSignature === razorpaySignature
}


function getCreditsForPlan(plan) {
    return plan === "monthly" ? 100 : 1200
}


function getSubscriptionDurationMs(plan) {
    return plan === "monthly" ? 30 * 24 * 60 * 60 * 1000 : 365 * 24 * 60 * 60 * 1000
}

module.exports = {
    createSubscriptionOrder,
    verifyPaymentSignature,
    getCreditsForPlan,
    getSubscriptionDurationMs,
    getRazorpayInstance
}