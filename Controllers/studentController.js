import Student from "../models/StudentSchema.js";

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

