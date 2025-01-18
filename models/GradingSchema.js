import mongoose from 'mongoose';

const GradingSchema = new mongoose.Schema({
    ta: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TA',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    answerSheetUrl: {
        type: String,
        required: true,
        unique: true
    },
    review: {
        type: String,
        required: true,
    },
    grade: {
        type: String,
        required: true,
    },
    feedback: {
        type: String,
        required: true,
    },
}, {
    timestamps: true
});

export default mongoose.model('Grading', GradingSchema);