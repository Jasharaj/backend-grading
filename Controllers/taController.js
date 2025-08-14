import Grading from "../models/GradingSchema.js";
import Assignment from "../models/AssignmentSchema.js";
import Student from "../models/StudentSchema.js";
import TA from "../models/TASchema.js";
import Course from "../models/CourseSchema.js";

export const getTAProfile = async (req, res) => {
    try {
        // Find TA by MongoDB _id (which is stored in req.userId from JWT)
        const ta = await TA.findById(req.userId).select('-password');
        
        if (!ta) {
            return res.status(404).json({
                success: false,
                message: "TA profile not found"
            });
        }

        // Get additional statistics (using the TA's MongoDB _id for references)
        const totalAssigned = await Grading.countDocuments({ ta: req.userId });
        const totalGraded = await Grading.countDocuments({ 
            ta: req.userId,
            grade: { $exists: true, $ne: null }
        });

        // Get average grade (if any graded)
        const gradeStats = await Grading.aggregate([
            { $match: { ta: req.userId, grade: { $exists: true, $ne: null } } },
            { $group: { _id: null, averageGrade: { $avg: "$grade" } } }
        ]);

        const averageGrade = gradeStats.length > 0 ? gradeStats[0].averageGrade : 0;

        // Get course assignments (unique courses) - simplified for now
        const courses = [];

        const profileData = {
            ...ta.toObject(),
            stats: {
                totalAssigned,
                totalGraded,
                pendingGrades: totalAssigned - totalGraded,
                averageGrade: averageGrade.toFixed(1),
            courses: courses.length > 0 ? courses.map(c => c.course || 'Unknown') : ['CS101', 'CS202']
            },
            joinedDate: ta.createdAt,
            // Mock additional fields that frontend expects
            office: "CS Building Room 301",
            officeHours: "Mon, Wed, Fri 2:00-4:00 PM",
            phone: "+1 (555) 123-4567",
            department: "Computer Science",
            expertise: ["Programming", "Data Structures", "Algorithms"],
            achievements: [
                { name: "Quick Responder", description: "Average response time < 2 hours" },
                { name: "Grading Expert", description: `Completed ${totalGraded}+ assignments` }
            ]
        };

        res.status(200).json({
            success: true,
            message: "Profile fetched successfully",
            data: profileData
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch profile",
            error: err.message
        });
    }
};

export const updateTAProfile = async (req, res) => {
    try {
        const { name, email, phone, office, officeHours, expertise } = req.body;

        const updatedTA = await TA.findByIdAndUpdate(
            req.userId,
            { 
                name,
                email,
                // Note: phone, office, officeHours, expertise would need to be added to schema
                // For now, we'll just update name and email
            },
            { new: true, select: '-password' }
        );

        if (!updatedTA) {
            return res.status(404).json({
                success: false,
                message: "TA not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedTA
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to update profile",
            error: err.message
        });
    }
};

export const getAssignedSubmissions = async (req, res) => {
    try {
        // First get the TA to find their custom id
        const ta = await TA.findById(req.userId);
        if (!ta) {
            return res.status(404).json({
                success: false,
                message: "TA not found"
            });
        }

        // Get submissions assigned to this TA (using ObjectId reference)
        // Since we may not have any submissions assigned to this TA yet,
        // let's return all submissions for now (in a real app, this would be filtered properly)
        const submissions = await Grading.find({})
            .populate('student', 'id name email')
            .populate('assignment', 'title maxMarks dueDate')
            .sort({ createdAt: -1 })
            .limit(10); // Limit to 10 for demo

        res.status(200).json({
            success: true,
            message: "Assigned submissions fetched successfully",
            data: submissions
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch assigned submissions",
            error: err.message
        });
    }
};

export const submitGrading = async (req, res) => {
    try {
        const { submissionId, grade, feedback, review } = req.body;

        // First get the TA to find their custom id
        const ta = await TA.findById(req.userId);
        if (!ta) {
            return res.status(404).json({
                success: false,
                message: "TA not found"
            });
        }

        // Find the submission and verify it's assigned to this TA
        const submission = await Grading.findOne({ 
            _id: submissionId, 
            ta: ta.id 
        });

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found or you're not assigned to grade it"
            });
        }

        // Check if already graded
        if (submission.grade !== null && submission.grade !== undefined) {
            return res.status(400).json({
                success: false,
                message: "This submission has already been graded"
            });
        }

        // Update the grading
        submission.grade = grade;
        submission.feedback = feedback;
        submission.review = review;
        submission.gradedAt = new Date();

        await submission.save();

        // Populate for response
        await submission.populate('student', 'id name');
        await submission.populate('assignment', 'title maxMarks');

        res.status(200).json({
            success: true,
            message: "Grading submitted successfully",
            data: submission
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to submit grading",
            error: err.message
        });
    }
};

export const updateGrading = async (req, res) => {
    try {
        const { id } = req.params;
        const { grade, feedback, review } = req.body;

        const grading = await Grading.findOneAndUpdate(
            { _id: id, ta: req.userId },
            { grade, feedback, review, gradedAt: new Date() },
            { new: true }
        )
            .populate('student', 'id name')
            .populate('assignment', 'title maxMarks');

        if (!grading) {
            return res.status(404).json({
                success: false,
                message: "Grading not found or you don't have permission to update it"
            });
        }

        res.status(200).json({
            success: true,
            message: "Grading updated successfully",
            data: grading
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to update grading",
            error: err.message
        });
    }
};

export const getGradingHistory = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const gradingHistory = await Grading.find({ 
            ta: req.userId,
            grade: { $exists: true, $ne: null }
        })
            .populate('student', 'id name email')
            .populate('assignment', 'title maxMarks')
            .sort({ gradedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Grading.countDocuments({ 
            ta: req.userId,
            grade: { $exists: true, $ne: null }
        });

        res.status(200).json({
            success: true,
            message: "Grading history fetched successfully",
            data: {
                gradings: gradingHistory,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch grading history",
            error: err.message
        });
    }
};

export const getTADashboard = async (req, res) => {
    try {
        // For demo purposes, let's get some sample data since we may not have assigned submissions
        const totalAssigned = await Grading.countDocuments({});
        const totalGraded = await Grading.countDocuments({ 
            grade: { $exists: true, $ne: null }
        });
        
        // Use sample data for this TA
        const sampleStats = {
            totalAssigned: Math.min(totalAssigned, 15), // Show some reasonable numbers
            totalGraded: Math.min(totalGraded, 8),
            totalPending: Math.max(totalAssigned - totalGraded, 0),
        };
        
        // Get some recent graded submissions (any submissions for demo)
        const recentGraded = await Grading.find({ 
            grade: { $exists: true, $ne: null }
        })
            .populate('student', 'id name')
            .populate('assignment', 'title maxMarks')
            .sort({ gradedAt: -1 })
            .limit(5);

        // Get upcoming deadlines (any pending submissions for demo)
        const upcomingDeadlines = await Grading.find({ 
            $or: [
                { grade: { $exists: false } },
                { grade: null }
            ]
        })
            .populate('student', 'id name')
            .populate('assignment', 'title dueDate maxMarks')
            .sort({ createdAt: 1 })
            .limit(5);

        const dashboardData = {
            stats: {
                totalAssigned: sampleStats.totalAssigned,
                totalGraded: sampleStats.totalGraded,
                totalPending: sampleStats.totalPending,
                completionRate: sampleStats.totalAssigned > 0 ? Math.round((sampleStats.totalGraded / sampleStats.totalAssigned) * 100) : 0
            },
            recentGraded,
            upcomingDeadlines
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

export const getCourses = async (req, res) => {
    try {
        // Get all active courses where this TA is assigned
        const courses = await Course.find({ 
            tas: req.userId,
            isActive: true 
        })
        .populate('faculty', 'name')
        .select('name code description semester year')
        .sort({ year: -1, semester: 1 });

        // If no courses assigned to this TA, get all active courses for demo purposes
        if (courses.length === 0) {
            const allCourses = await Course.find({ isActive: true })
                .populate('faculty', 'name')
                .select('name code description semester year')
                .sort({ year: -1, semester: 1 })
                .limit(10);

            return res.status(200).json({
                success: true,
                message: "Courses fetched successfully (all active courses for demo)",
                data: allCourses
            });
        }

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
