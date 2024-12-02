import mongoose from 'mongoose';


const FeedbackSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    feedbackText: { type: String, required: true },
});

const Feedback = mongoose.model('Feedback', FeedbackSchema);
export default Feedback;