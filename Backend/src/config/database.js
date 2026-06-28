import mongoose from "mongoose"

async function connectToDB() {

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            maxPoolSize: 100,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            retryWrites: true,
            w: "majority",
        })

        console.log("Connected to Database")
    }
    catch (err) {
        console.error("Failed to connect to Database:", err.message)
        process.exit(1)
    }
}

export default connectToDB