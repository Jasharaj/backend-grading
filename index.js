import express from 'express'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import cors from 'cors'
import mongoose from 'mongoose'
import authRoute from './Routes/auth.js' 
import gradingRoute from './Routes/grading.js'
import studentRoute from './Routes/student.js'
import facultyRoute from './Routes/faculty.js'
import taRoute from './Routes/ta.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 8000

const corsOptions = {
    origin: true,
};

app.get("/", (req, res) => {
    res.send("AI Grading Platform API is working")
})

//database connection
mongoose.set('strictQuery', false);
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log("MongoDB database is connected")
    } catch (err) {
        console.log("MongoDB database connection failed", err)
    }
}

//middleware
app.use(express.json())
app.use(cookieParser())
app.use(cors(corsOptions))

// Routes
app.use('/auth', authRoute)
app.use('/grading', gradingRoute)
app.use('/students', studentRoute)
app.use('/faculty', facultyRoute)
app.use('/ta', taRoute)

app.listen(port, () => {
    connectDB()
    console.log(`Server is running on port ${port}`)
})


