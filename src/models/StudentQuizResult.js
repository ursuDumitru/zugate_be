// models/StudentQuizResult.js
import mongoose from 'mongoose';

const StudentQuizResultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  answers: [
    {
      questionId: mongoose.Schema.Types.ObjectId,
      selectedOption: String,
      isCorrect: Boolean, // Adăugăm acest câmp pentru a indica dacă răspunsul este corect
    },
  ],
  score: { type: Number },
});

const StudentQuizResult = mongoose.model('StudentQuizResult', StudentQuizResultSchema);
export default StudentQuizResult;