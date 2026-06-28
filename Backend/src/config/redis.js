import Redis from "ioredis"

let client = null

function getRedisClient() {
    if (client) {
        return client
    }

    const url = process.env.REDIS_URL || "redis://127.0.0.1:6379"

    client = new Redis(url, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
        retryStrategy(times) {
            const delay = Math.min(times * 200, 3000)
            return delay
        },
        reconnectOnError(err) {
            const targetError = "READONLY"
            if (err.message.includes(targetError)) {
                return true
            }
            return false
        },
    })

    client.on("connect", () => {
        console.log("Connected to Redis")
    })

    client.on("error", (err) => {
        console.error("Redis error:", err.message)
    })

    return client
}

export { getRedisClient }
