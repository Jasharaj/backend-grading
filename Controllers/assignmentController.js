import Assignment from "../models/AssignmentSchema.js";
import Student from "../models/StudentSchema.js";

export const submitAssignment = async (req, res) => {
    const { courseId, student, assignmentUrl } = req.body;

    try {
        // // Verify if student exists
        // const existingStudent = await Student.findById(student);
        // if (!existingStudent) {
        //     return res.status(404).json({
        //         success: false,
        //         message: "Student not found"
        //     });
        // }

        // // Check if assignment already exists for this student and course
        // const existingAssignment = await Assignment.findOne({ 
        //     courseId,
        //     student
        // });

        // if (existingAssignment) {
        //     // Update existing assignment
        //     existingAssignment.assignmentUrl = assignmentUrl;
        //     await existingAssignment.save();

        //     return res.status(200).json({
        //         success: true,
        //         message: "Assignment updated successfully",
        //         data: existingAssignment
        //     });
        // }

        // Create new assignment
        const newAssignment = new Assignment({
            courseId,
            student,
            assignmentUrl
        });

        await newAssignment.save();

        // Return success response with populated data
        const savedAssignment = await Assignment.findById(newAssignment._id)
            .populate('student', 'name id');

        res.status(201).json({
            success: true,
            message: "Assignment submitted successfully",
            data: savedAssignment
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

export const getAssignments = async (req, res) => {
    const { courseId } = req.body;

    try {
        // Get all assignments for the course
        const assignments = await Assignment.find({ courseId })
            .populate('student', 'name id')
            .sort({ createdAt: -1 }); // Sort by newest first

        res.status(200).json({
            success: true,
            message: "Assignments fetched successfully",
            count: assignments.length,
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