import mongoose from 'mongoose';

const AssignmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    instructions: {
        type: String
    },
    dueDate: {
        type: Date,
        required: true
    },
    maxMarks: {
        type: Number,
        required: true,
        min: 0
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

export default mongoose.model('Assignment', AssignmentSchema);