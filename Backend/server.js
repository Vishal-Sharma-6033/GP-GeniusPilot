require("dotenv").config()
const app = require("./src/app")
const connectToDB = require("./src/config/database")

// Only start listening once the database connection succeeds.
// connectToDB() exits the process on failure, so this only runs when connected.
connectToDB().then(() => {
    app.listen(3000, () => {
        console.log("Server is running on port 3000")
    })
})