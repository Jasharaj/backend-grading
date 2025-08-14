import express from 'express'
import { authenticate, restrict } from '../auth/verifyToken.js'
import { 
    getAllStudents, 
    getStudentDashboard,
    getStudentAssignments,
    submitAssignment,
    getStudentGrades,
    getStudentProfile,
    updateStudentProfile,
    requestRevaluation,
    getRevaluationRequests
} from '../Controllers/studentController.js'

const router = express.Router()

// Public route for getting all students (used by faculty/TA)
router.get("/getAllStudents", authenticate, restrict(['Faculty', 'TA']), getAllStudents)

// Student-specific protected routes
router.use(authenticate)
router.use(restrict(['Student']))

router.get('/dashboard', getStudentDashboard)
router.get('/assignments', getStudentAssignments)
router.post('/assignments/:id/submit', submitAssignment)
router.get('/grades', getStudentGrades)
router.get('/profile', getStudentProfile)
router.put('/profile', updateStudentProfile)
router.get('/revaluation', getRevaluationRequests)
router.post('/revaluation', requestRevaluation)

export default router