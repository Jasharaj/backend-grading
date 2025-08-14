import mongoose from 'mongoose';
import Student from "../models/StudentSchema.js";
import Assignment from "../models/AssignmentSchema.js";
import Grading from "../models/GradingSchema.js";

export const getAllStudents = async (req, res) => {
    try {
        const students = await Student.find({}).select("-password");

        res.status(200).json({
            success: true,
            message: "Students found successfully",
            data: students
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch students",
            error: err.message
        });
    }
};

export const getStudentDashboard = async (req, res) => {
    try {
        console.log('Dashboard request received for user:', req.userId);
        
        // Get total assignments
        const totalAssignments = await Assignment.countDocuments({});
        console.log('Total assignments:', totalAssignments);
        
        // Get submitted assignments
        const submittedAssignments = await Grading.countDocuments({ 
            student: req.userId 
        });
        console.log('Submitted assignments:', submittedAssignments);
        
        // Get graded assignments
        const gradedAssignments = await Grading.countDocuments({ 
            student: req.userId,
            grade: { $exists: true, $ne: null }
        });
        console.log('Graded assignments:', gradedAssignments);
        
        // Get pending assignments
        const pendingAssignments = totalAssignments - submittedAssignments;
        
        // Get recent grades
        const recentGrades = await Grading.find({ 
            student: req.userId,
            grade: { $exists: true, $ne: null }
        })
            .populate('assignment', 'title maxMarks dueDate')
            .sort({ gradedAt: -1 })
            .limit(5);

        console.log('Recent grades:', recentGrades.length);

        // Get upcoming assignments (not submitted yet)
        const submittedAssignmentIds = await Grading.find({ 
            student: req.userId 
        }).distinct('assignment');

        const upcomingAssignments = await Assignment.find({
            _id: { $nin: submittedAssignmentIds },
            dueDate: { $gte: new Date() }
        })
            .populate('course', 'name code')
            .sort({ dueDate: 1 })
            .limit(5);

        console.log('Upcoming assignments:', upcomingAssignments.length);

        const dashboardData = {
            stats: {
                totalAssignments,
                submittedAssignments,
                gradedAssignments,
                pendingAssignments
            },
            recentGrades,
            upcomingAssignments
        };

        console.log('Sending dashboard data:', dashboardData);

        res.status(200).json({
            success: true,
            message: "Dashboard data fetched successfully",
            data: dashboardData
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard data",
            error: err.message
        });
    }
};

export const getStudentAssignments = async (req, res) => {
    try {
        const assignments = await Assignment.find({})
            .populate('course', 'name code')
            .populate('createdBy', 'name')
            .sort({ dueDate: 1 });

        // Get submission status for each assignment
        const assignmentsWithStatus = await Promise.all(
            assignments.map(async (assignment) => {
                const submission = await Grading.findOne({
                    student: req.userId,
                    assignment: assignment._id
                });

                return {
                    ...assignment.toObject(),
                    submissionStatus: submission ? 'submitted' : 'pending',
                    grade: submission?.grade || null,
                    feedback: submission?.feedback || null,
                    submittedAt: submission?.createdAt || null,
                    gradedAt: submission?.gradedAt || null
                };
            })
        );

        res.status(200).json({
            success: true,
            message: "Assignments fetched successfully",
            data: assignmentsWithStatus
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

export const submitAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { answerSheetUrl, ta } = req.body;

        // Check if assignment exists
        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found"
            });
        }

        // Check if already submitted
        const existingSubmission = await Grading.findOne({
            student: req.userId,
            assignment: id
        });

        if (existingSubmission) {
            return res.status(400).json({
                success: false,
                message: "Assignment already submitted"
            });
        }

        // Check if due date has passed
        if (new Date() > assignment.dueDate) {
            return res.status(400).json({
                success: false,
                message: "Assignment due date has passed"
            });
        }

        // Create submission
        const newSubmission = new Grading({
            student: req.userId,
            assignment: id,
            answerSheetUrl,
            ta: ta || null // TA will be assigned later if not specified
        });

        await newSubmission.save();

        res.status(201).json({
            success: true,
            message: "Assignment submitted successfully",
            data: newSubmission
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to submit assignment",
            error: err.message
        });
    }
};

export const getStudentGrades = async (req, res) => {
    try {
        console.log('Grades request received for user:', req.userId);
        
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const grades = await Grading.find({ 
            student: req.userId,
            grade: { $exists: true, $ne: null }
        })
            .populate('assignment', 'title maxMarks dueDate course')
            .populate({
                path: 'assignment',
                populate: {
                    path: 'course',
                    select: 'name code'
                }
            })
            .populate('ta', 'name')
            .sort({ gradedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        console.log('Found grades:', grades.length);

        const total = await Grading.countDocuments({ 
            student: req.userId,
            grade: { $exists: true, $ne: null }
        });

        const responseData = {
            grades,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        };

        console.log('Sending grades response:', responseData);

        res.status(200).json({
            success: true,
            message: "Grades fetched successfully",
            data: responseData
        });
    } catch (err) {
        console.error('Grades error:', err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch grades",
            error: err.message
        });
    }
};

export const getStudentProfile = async (req, res) => {
    try {
        console.log('Profile request received for user:', req.userId);
        
        const student = await Student.findById(req.userId).select("-password");

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        // Get additional profile data
        const totalGrades = await Grading.countDocuments({
            student: req.userId,
            grade: { $exists: true, $ne: null }
        });

        const totalSubmissions = await Grading.countDocuments({
            student: req.userId
        });

        const averageGrade = await Grading.aggregate([
            { $match: { student: new mongoose.Types.ObjectId(req.userId), grade: { $exists: true, $ne: null } } },
            { $group: { _id: null, avgGrade: { $avg: '$grade' } } }
        ]);

        const profileData = {
            ...student.toObject(),
            statistics: {
                totalSubmissions,
                gradedAssignments: totalGrades,
                averageGrade: averageGrade.length > 0 ? Math.round(averageGrade[0].avgGrade) : 0
            }
        };

        console.log('Sending profile data:', profileData);

        res.status(200).json({
            success: true,
            message: "Profile fetched successfully",
            data: profileData
        });
    } catch (err) {
        console.error('Profile error:', err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch profile",
            error: err.message
        });
    }
};

export const updateStudentProfile = async (req, res) => {
    try {
        console.log('Profile update request received for user:', req.userId);
        console.log('Update data:', req.body);
        
        const { name, email, phone, address, major, year } = req.body;
        
        // Update the student profile
        const updatedStudent = await Student.findByIdAndUpdate(
            req.userId,
            {
                name,
                email,
                phone,
                address,
                major,
                year
            },
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedStudent) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        console.log('Profile updated successfully:', updatedStudent);

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedStudent
        });
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({
            success: false,
            message: "Failed to update profile",
            error: err.message
        });
    }
};

export const requestRevaluation = async (req, res) => {
    try {
        const { gradingId, reason } = req.body;

        // Find the grading record
        const grading = await Grading.findOne({
            _id: gradingId,
            student: req.userId
        });

        if (!grading) {
            return res.status(404).json({
                success: false,
                message: "Grading record not found"
            });
        }

        if (!grading.grade) {
            return res.status(400).json({
                success: false,
                message: "Assignment not yet graded"
            });
        }

        if (grading.revaluationRequested) {
            return res.status(400).json({
                success: false,
                message: "Revaluation already requested for this assignment"
            });
        }

        // Update grading record with revaluation request
        grading.revaluationRequested = true;
        grading.revaluationReason = reason;
        grading.revaluationRequestedAt = new Date();
        grading.status = 'revaluation_requested';

        await grading.save();

        res.status(200).json({
            success: true,
            message: "Revaluation request submitted successfully"
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to submit revaluation request",
            error: err.message
        });
    }
};

export const getRevaluationRequests = async (req, res) => {
    try {
        console.log('Revaluation requests for user:', req.userId);

        const requests = await Grading.find({
            student: req.userId,
            revaluationRequested: true
        })
            .populate('assignment', 'title maxMarks course')
            .populate({
                path: 'assignment',
                populate: {
                    path: 'course',
                    select: 'name code'
                }
            })
            .sort({ revaluationRequestedAt: -1 });

        console.log('Found revaluation requests:', requests.length);

        res.status(200).json({
            success: true,
            message: "Revaluation requests fetched successfully",
            data: requests
        });
    } catch (err) {
        console.error('Revaluation requests error:', err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch revaluation requests",
            error: err.message
        });
    }
};

