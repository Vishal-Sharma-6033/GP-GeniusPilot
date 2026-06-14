const jwt = require("jsonwebtoken")
const { getRedisClient } = require("../config/redis")



async function authUser(req, res, next) {

    const token = req.cookies.token

    if (!token) {
        return res.status(401).json({
            message: "Token not provided."
        })
    }

    try {
        const isTokenBlacklisted = await getRedisClient().exists(`bl:${token}`)

        if (isTokenBlacklisted) {
            return res.status(401).json({
                message: "token is invalid"
            })
        }
    } catch (err) {
        // Fail open: if Redis is unreachable, fall back to JWT verification alone
        // rather than locking every user out of the app.
        console.error("Redis blacklist check failed:", err.message)
    }

    try {
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: "Auth configuration is missing"
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = decoded

        next()

    } catch (err) {

        return res.status(401).json({
            message: "Invalid token."
        })
    }

}


module.exports = { authUser }