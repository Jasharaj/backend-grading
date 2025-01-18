import mongoose from 'mongoose';

const CourseSchema = new mongoose.Schema({
    courseId: {
        type: String,
        required: true,
        unique: true
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    ta: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TA'
    }]
}, {
    timestamps: true
});

export default mongoose.model('Course', CourseSchema);