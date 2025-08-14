import express from 'express'
import { authenticate, restrict } from '../auth/verifyToken.js'
import { 
    createAssignment, 
    getFacultyAssignments,
    updateAssignment,
    deleteAssignment,
    getAssignmentSubmissions,
    getFacultyDashboard,
    getAllTAs,
    getAllStudents,
    getCourses,
    getCourse,
    createCourse,
    updateCourse,
    deleteCourse
} from '../Controllers/facultyController.js'

const router = express.Router()

// All routes are protected and restricted to Faculty only
router.use(authenticate)
router.use(restrict(['Faculty']))

// Assignment Management
router.post('/assignments', createAssignment)
router.get('/assignments', getFacultyAssignments)
router.put('/assignments/:id', updateAssignment)
router.delete('/assignments/:id', deleteAssignment)
router.get('/assignments/:id/submissions', getAssignmentSubmissions)

// Dashboard
router.get('/dashboard', getFacultyDashboard)

// TAs
router.get('/tas', getAllTAs)

// Students  
router.get('/students', getAllStudents)

// Courses
router.get('/courses', getCourses)
router.get('/courses/:id', getCourse)
router.post('/courses', createCourse)
router.put('/courses/:id', updateCourse)
router.delete('/courses/:id', deleteCourse)

export default router
