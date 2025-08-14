import express from 'express'
import { authenticate, restrict } from '../auth/verifyToken.js'
import { 
    getAssignedSubmissions,
    submitGrading,
    updateGrading,
    getTADashboard,
    getGradingHistory,
    getTAProfile,
    updateTAProfile,
    getCourses
} from '../Controllers/taController.js'

const router = express.Router()

// All routes are protected and restricted to TA only
router.use(authenticate)
router.use(restrict(['TA']))

// Profile Management
router.get('/profile', getTAProfile)
router.put('/profile', updateTAProfile)

// Grading Management
router.get('/submissions', getAssignedSubmissions)
router.post('/grade', submitGrading)
router.put('/grade/:id', updateGrading)
router.get('/history', getGradingHistory)

// Dashboard
router.get('/dashboard', getTADashboard)

// Courses
router.get('/courses', getCourses)

export default router
