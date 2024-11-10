// models/Grade.js
import mongoose from 'mongoose';

const GradeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  grade: { type: String, required: true },
});

const Grade = mongoose.model('Grade', GradeSchema);
export default Grade;