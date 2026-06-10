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
        default: 10,
        min: 0
    }
}, {
    timestamps: true
})

const userModel = mongoose.model("users", userSchema)

module.exports = userModel