// models/StudentQuizResult.js
import mongoose from 'mongoose';

const StudentQuizResultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  score: { type: Number, required: true },
  completedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const StudentQuizResult = mongoose.model('StudentQuizResult', StudentQuizResultSchema);
export default StudentQuizResult;