import Assignment from "../models/AssignmentSchema.js";
import Student from "../models/StudentSchema.js";
import Grading from "../models/GradingSchema.js";
import Course from "../models/CourseSchema.js";
import TA from "../models/TASchema.js";

export const createAssignment = async (req, res) => {
    try {
        const { title, description, dueDate, course, maxMarks, instructions } = req.body;
        
        const newAssignment = new Assignment({
            title,
            description,
            dueDate,
            course,
            maxMarks,
            instructions,
            createdBy: req.userId
        });

        await newAssignment.save();

        res.status(201).json({
            success: true,
            message: "Assignment created successfully",
            data: newAssignment
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to create assignment",
            error: err.message
        });
    }
};

export const getFacultyAssignments = async (req, res) => {
    try {
        const assignments = await Assignment.find({ createdBy: req.userId })
            .populate('course', 'name code')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "Assignments fetched successfully",
            data: assignments
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch assignments",
            error: err.message
        });
    }
};

export const updateAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, dueDate, course, maxMarks, instructions } = req.body;

        const assignment = await Assignment.findOneAndUpdate(
            { _id: id, createdBy: req.userId },
            { title, description, dueDate, course, maxMarks, instructions },
            { new: true }
        );

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found or you don't have permission to update it"
            });
        }

        res.status(200).json({
            success: true,
            message: "Assignment updated successfully",
            data: assignment
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to update assignment",
            error: err.message
        });
    }
};

export const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;

        const assignment = await Assignment.findOneAndDelete({
            _id: id,
            createdBy: req.userId
        });

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found or you don't have permission to delete it"
            });
        }

        res.status(200).json({
            success: true,
            message: "Assignment deleted successfully"
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to delete assignment",
            error: err.message
        });
    }
};

export const getAssignmentSubmissions = async (req, res) => {
    try {
        const { id } = req.params;

        // Verify assignment belongs to this faculty
        const assignment = await Assignment.findOne({ _id: id, createdBy: req.userId });
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found or you don't have access"
            });
        }

        const submissions = await Grading.find({ assignment: id })
            .populate('student', 'id name email')
            .populate('ta', 'id name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "Submissions fetched successfully",
            data: submissions
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch submissions",
            error: err.message
        });
    }
};

export const getFacultyDashboard = async (req, res) => {
    try {
        // Get total assignments created by faculty
        const totalAssignments = await Assignment.countDocuments({ createdBy: req.userId });
        
        // Get total students across all assignments
        const assignments = await Assignment.find({ createdBy: req.userId }).select('_id');
        const assignmentIds = assignments.map(a => a._id);
        
        const totalSubmissions = await Grading.countDocuments({ 
            assignment: { $in: assignmentIds } 
        });
        
        const gradedSubmissions = await Grading.countDocuments({ 
            assignment: { $in: assignmentIds },
            grade: { $exists: true, $ne: null }
        });

        // Get recent assignments
        const recentAssignments = await Assignment.find({ createdBy: req.userId })
            .populate('course', 'name code')
            .sort({ createdAt: -1 })
            .limit(5);

        // Get pending submissions (not graded yet)
        const pendingSubmissions = await Grading.find({ 
            assignment: { $in: assignmentIds },
            $or: [
                { grade: { $exists: false } },
                { grade: null }
            ]
        })
            .populate('student', 'id name')
            .populate('assignment', 'title')
            .sort({ createdAt: 1 })
            .limit(10);

        const dashboardData = {
            stats: {
                totalAssignments,
                totalSubmissions,
                gradedSubmissions,
                pendingSubmissions: totalSubmissions - gradedSubmissions
            },
            recentAssignments,
            pendingSubmissions
        };

        res.status(200).json({
            success: true,
            message: "Dashboard data fetched successfully",
            data: dashboardData
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard data",
            error: err.message
        });
    }
};

export const getAllTAs = async (req, res) => {
    try {
        const tas = await TA.find({}, '-password').sort({ name: 1 });
        
        // Add default values for fields that don't exist in the schema
        const enrichedTAs = tas.map(ta => ({
            ...ta.toObject(),
            phone: ta.phone || null,
            courses: ta.courses || [],
            isActive: ta.isActive !== undefined ? ta.isActive : true
        }));
        
        res.status(200).json({
            success: true,
            message: "TAs fetched successfully",
            data: enrichedTAs
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch TAs",
            error: err.message
        });
    }
};

// Get all courses for the current faculty
export const getCourses = async (req, res) => {
    try {
        const facultyId = req.userId;
        
        const courses = await Course.find({ faculty: facultyId, isActive: true }, 'name code description semester year students isActive')
            .sort({ year: -1, semester: 1, name: 1 });
        
        res.status(200).json({
            success: true,
            message: "Courses fetched successfully",
            data: courses
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch courses",
            error: err.message
        });
    }
};

// Create a new course (for testing)
export const createCourse = async (req, res) => {
    try {
        const facultyId = req.userId;
        const { name, code, description, semester, year } = req.body;
        
        const newCourse = new Course({
            name,
            code,
            description,
            faculty: facultyId,
            semester,
            year,
            students: [],
            tas: []
        });
        
        await newCourse.save();
        
        res.status(201).json({
            success: true,
            message: "Course created successfully",
            data: newCourse
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to create course",
            error: err.message
        });
    }
};

export const getAllStudents = async (req, res) => {
    try {
        const students = await Student.find({})
            .select('name email studentId department year semester')
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            message: "Students fetched successfully",
            data: students
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch students",
            error: err.message
        });
    }
};

export const getCourse = async (req, res) => {
    try {
        const courseId = req.params.id;
        const facultyId = req.userId;
        
        const course = await Course.findOne({ _id: courseId, faculty: facultyId })
            .populate('students', 'name email studentId department')
            .populate('faculty', 'name email');
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Course fetched successfully",
            data: course
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch course",
            error: err.message
        });
    }
};

export const updateCourse = async (req, res) => {
    try {
        const courseId = req.params.id;
        const facultyId = req.userId;
        const updateData = req.body;

        const course = await Course.findOneAndUpdate(
            { _id: courseId, faculty: facultyId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Course updated successfully",
            data: course
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to update course",
            error: err.message
        });
    }
};

export const deleteCourse = async (req, res) => {
    try {
        const courseId = req.params.id;
        const facultyId = req.userId;

        const course = await Course.findOneAndDelete({ _id: courseId, faculty: facultyId });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Course deleted successfully"
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to delete course",
            error: err.message
        });
    }
};
