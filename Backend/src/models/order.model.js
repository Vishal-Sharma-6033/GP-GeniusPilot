const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    razorpayOrderId: {
        type: String,
        required: true,
        unique: true
    },
    razorpayPaymentId: {
        type: String,
        default: null
    },
    razorpaySignature: {
        type: String,
        default: null
    },
    plan: {
        type: String,
        enum: ["monthly", "yearly"],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: "INR"
    },
    status: {
        type: String,
        enum: ["created", "paid", "failed"],
        default: "created"
    },
    creditsAdded: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
})

const orderModel = mongoose.model("orders", orderSchema)

module.exports = orderModel