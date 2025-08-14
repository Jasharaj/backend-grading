import mongoose from 'mongoose';

const CourseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String
    },
    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
        required: true
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    tas: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TA'
    }],
    semester: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

export default mongoose.model('Course', CourseSchema);