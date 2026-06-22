import "dotenv/config"
import app from "./src/app.js"
import connectToDB from "./src/config/database.js"

connectToDB().then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`)
    })
})