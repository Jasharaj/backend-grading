import mongoose from 'mongoose';

const GradingSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    assignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true
    },
    ta: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TA',
        required: false // Will be assigned later
    },
    answerSheetUrl: {
        type: String,
        required: true
    },
    grade: {
        type: Number,
        min: 0,
        required: false // Not required until graded
    },
    feedback: {
        type: String,
        required: false // Not required until graded
    },
    review: {
        type: String,
        required: false // TA's review comments
    },
    gradedAt: {
        type: Date
    },
    revaluationRequested: {
        type: Boolean,
        default: false
    },
    revaluationReason: {
        type: String
    },
    revaluationRequestedAt: {
        type: Date
    },
    status: {
        type: String,
        enum: ['submitted', 'assigned', 'graded', 'revaluation_requested'],
        default: 'submitted'
    }
}, {
    timestamps: true
});

// Ensure one submission per student per assignment
GradingSchema.index({ student: 1, assignment: 1 }, { unique: true });

export default mongoose.model('Grading', GradingSchema);