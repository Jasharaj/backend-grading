import Grading from "../models/GradingSchema.js";
import Student from "../models/StudentSchema.js";
import TA from "../models/TASchema.js";

export const submitGrade = async (req, res) => {
    const { ta, student, answerSheetUrl, review, grade, feedback } = req.body;

    try {
        // Find TA and Student first
        const taDoc = await TA.findOne({ id: ta });
        if (!taDoc) {
            return res.status(404).json({
                success: false,
                message: "TA not found with the given registration number"
            });
        }

        const studentDoc = await Student.findOne({ id: student });
        if (!studentDoc) {
            return res.status(404).json({
                success: false,
                message: "Student not found with the given registration number"
            });
        }

        // Check if grading already exists for this answer sheet
        const existingGrading = await Grading.findOne({ answerSheetUrl });

        if (existingGrading) {
            return res.status(400).json({
                success: false,
                message: "Grading already exists for this answer sheet"
            });
        }

        // Create new grading with ObjectIds
        const newGrading = new Grading({
            ta: taDoc._id,
            student: studentDoc._id,
            answerSheetUrl,
            review,
            grade,
            feedback
        });
       

        // Save the grading
        await newGrading.save();

        // Return success response with populated data
        const savedGrading = await Grading.findById(newGrading._id)
            .populate('ta', 'name id')
            .populate('student', 'name id');

        res.status(201).json({
            success: true,
            message: "Grade submitted successfully",
            data: savedGrading
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to submit grade",
            error: err.message
        });
    }
};

export const getGradings = async (req, res) => {
    const { ta } = req.body;

    try {
        // Verify if TA exists     
        const existingTA = await TA.findOne({ id: ta });
        if (!existingTA) {
            return res.status(404).json({
                success: false,
                message: "TA not found"
            });
        }

        // Get all gradings for the TA
        const gradings = await Grading.find({ ta: existingTA._id })
            .populate('student', 'name id')
            .populate('ta', 'name id')
            .sort({ createdAt: -1 }); // Sort by newest first

        res.status(200).json({
            success: true,
            message: "Gradings fetched successfully",
            count: gradings.length,
            data: gradings
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch gradings",
            error: err.message
        });
    }
};