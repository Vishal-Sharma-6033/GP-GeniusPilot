const mongoose = require("mongoose")



async function connectToDB() {

    try {
        await mongoose.connect(process.env.MONGO_URI)

        console.log("Connected to Database")
    }
    catch (err) {
        console.error("Failed to connect to Database:", err.message)
        // Don't run a server that can't reach the database — every request would fail.
        process.exit(1)
    }
}

module.exports = connectToDB