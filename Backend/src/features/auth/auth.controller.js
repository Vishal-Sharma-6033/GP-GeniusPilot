const userModel = require("./user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { getRedisClient } = require("../../config/redis")
const { getAuthCookieOptions } = require("./auth.cookie")


async function registerUserController(req, res) {

    const { username, email, password } = req.body

    if (!username || !email || !password) {
        return res.status(400).json({
            message: "Please provide username, email and password"
        })
    }

    const normalizedUsername = String(username).trim()
    const normalizedEmail = String(email).trim().toLowerCase()

    const isUserAlreadyExists = await userModel.findOne({
        $or: [{ username: normalizedUsername }, { email: normalizedEmail }]
    })

    if (isUserAlreadyExists) {
        return res.status(400).json({
            message: "Account already exists with this email address or username"
        })
    }

    const hash = await bcrypt.hash(password, 10)

    try {
        const user = await userModel.create({
            username: normalizedUsername,
            email: normalizedEmail,
            password: hash
        })

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        )

        res.cookie("token", token, getAuthCookieOptions())

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                credits: user.credits,
                subscriptionPlan: user.subscriptionPlan,
                subscriptionExpiry: user.subscriptionExpiry
            }
        })
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({
                message: "Account already exists with this email address or username"
            })
        }

        return res.status(500).json({
            message: "Failed to register user"
        })
    }

}

async function loginUserController(req, res) {

    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({
            message: "Please provide email and password"
        })
    }

    const user = await userModel.findOne({ email: String(email).trim().toLowerCase() })

    if (!user) {
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    res.cookie("token", token, getAuthCookieOptions())
    res.status(200).json({
        message: "User loggedIn successfully.",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            credits: user.credits,
            subscriptionPlan: user.subscriptionPlan,
            subscriptionExpiry: user.subscriptionExpiry
        }
    })
}

async function logoutUserController(req, res) {
    const token = req.cookies.token

    if (token) {
        try {
            const decoded = jwt.decode(token)
            const nowSeconds = Math.floor(Date.now() / 1000)
            const ttl = decoded && decoded.exp ? decoded.exp - nowSeconds : 0

            if (ttl > 0) {
                await getRedisClient().set(`bl:${token}`, "1", "EX", ttl)
            }
        } catch (err) {
            console.error("Failed to blacklist token in Redis:", err.message)
        }
    }

    res.clearCookie("token", getAuthCookieOptions())

    res.status(200).json({
        message: "User logged out successfully"
    })
}

async function getMeController(req, res) {

    const user = await userModel.findById(req.user.id)

    if (!user) {
        return res.status(404).json({
            message: "User not found"
        })
    }


    res.status(200).json({
        message: "User details fetched successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            credits: user.credits,
            subscriptionPlan: user.subscriptionPlan,
            subscriptionExpiry: user.subscriptionExpiry
        }
    })

}

module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
}