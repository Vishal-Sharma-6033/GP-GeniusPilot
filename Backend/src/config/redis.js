import Redis from "ioredis"

let client = null

function getRedisClient() {
    if (client) {
        return client
    }

    const url = process.env.REDIS_URL || "redis://127.0.0.1:6379"

    client = new Redis(url, {
    
        maxRetriesPerRequest: 2
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
