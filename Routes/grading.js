import express from 'express'
import { submitGrade, getGradings } from '../Controllers/gradingController.js'

const router = express.Router()

router.post("/submitGrade", submitGrade)
router.get("/getGrade", getGradings)

export default router