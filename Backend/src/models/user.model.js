const mongoose = require("mongoose")


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 30,
    },

    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
    },

    password: {
        type: String,
        required: true
    },
    credits: {
        type: Number,
        default: 5,
        min: 0
    },
    subscriptionPlan: {
        type: String,
        enum: ["free", "monthly", "yearly"],
        default: "free"
    },
    subscriptionExpiry: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
})

const userModel = mongoose.model("users", userSchema)

module.exports = userModel