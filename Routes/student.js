import express from 'express'
import { getAllStudents } from '../Controllers/studentController.js'

const router = express.Router()

router.get("/getAllStudents", getAllStudents)

export default router