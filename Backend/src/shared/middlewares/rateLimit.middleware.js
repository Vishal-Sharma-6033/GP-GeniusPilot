import { getRedisClient } from "../../config/redis.js"


function createRateLimiter({ keyPrefix = "rl", windowSeconds = 60, max = 5, message } = {}) {
    return async function rateLimiter(req, res, next) {
        const identifier = (req.user && req.user.id) || req.ip
        const key = `${keyPrefix}:${identifier}`

        try {
            const redis = getRedisClient()
            const count = await redis.incr(key)

            if (count === 1) {
                await redis.expire(key, windowSeconds)
            }

            if (count > max) {
                const ttl = await redis.ttl(key)
                const retryAfter = ttl > 0 ? ttl : windowSeconds

                res.set("Retry-After", String(retryAfter))
                return res.status(429).json({
                    message: message || `Too many requests. Please try again in ${retryAfter} seconds.`
                })
            }
        } catch (err) {
            console.error("Rate limiter error (failing closed):", err.message)
            return res.status(503).json({
                message: "Service temporarily unavailable. Please try again later."
            })
        }

        next()
    }
}

export { createRateLimiter }
