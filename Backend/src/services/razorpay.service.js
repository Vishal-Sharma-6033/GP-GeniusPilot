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

/**
 * Create a Razorpay order for subscription
 * @param {Object} params
 * @param {string} params.plan - "monthly" or "yearly"
 * @returns {Promise<Object>} razorpayOrder
 */
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

/**
 * Verify Razorpay payment signature
 * @param {Object} params
 * @param {string} params.razorpayOrderId
 * @param {string} params.razorpayPaymentId
 * @param {string} params.razorpaySignature
 * @returns {boolean}
 */
function verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex")

    return expectedSignature === razorpaySignature
}

/**
 * Get credits to add based on plan
 * @param {string} plan 
 * @returns {number}
 */
function getCreditsForPlan(plan) {
    // Monthly: 100 credits, Yearly: 1200 credits (2 months free)
    return plan === "monthly" ? 100 : 1200
}

/**
 * Get expiry duration in ms
 * @param {string} plan 
 * @returns {number}
 */
function getSubscriptionDurationMs(plan) {
    // Monthly: 30 days, Yearly: 365 days
    return plan === "monthly" ? 30 * 24 * 60 * 60 * 1000 : 365 * 24 * 60 * 60 * 1000
}

module.exports = {
    createSubscriptionOrder,
    verifyPaymentSignature,
    getCreditsForPlan,
    getSubscriptionDurationMs,
    getRazorpayInstance
}