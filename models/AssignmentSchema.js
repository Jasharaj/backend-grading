import mongoose from 'mongoose';

const AssignmentSchema = new mongoose.Schema({
    courseId: {
        type: String,
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
    },
    assignmentUrl: {
        type: String,
    }
}, {
    timestamps: true
});

export default mongoose.model('Assignment', AssignmentSchema);