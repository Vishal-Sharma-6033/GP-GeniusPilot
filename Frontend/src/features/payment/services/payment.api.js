import axios from "axios"

const api = axios.create({
    baseURL: "",
    withCredentials: true,
})

/**
 * @description Create a Razorpay order for subscription
 */
export async function createOrder({ plan }) {
    const response = await api.post("/api/payment/create-order", { plan })
    return response.data
}

/**
 * @description Verify Razorpay payment and add credits
 */
export async function verifyPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature, plan }) {
    const response = await api.post("/api/payment/verify", {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        plan
    })
    return response.data
}

/**
 * @description Get current user subscription status
 */
export async function getSubscriptionStatus() {
    const response = await api.get("/api/payment/subscription")
    return response.data
}