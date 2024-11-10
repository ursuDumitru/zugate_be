// models/Quiz.js
import mongoose from 'mongoose';

const QuizSchema = new mongoose.Schema({
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  questions: [
    {
      questionText: { type: String, required: true },
      options: [{ text: String }],
      correctAnswer: { type: String, required: true },
    },
  ],
  approved: { type: Boolean, default: false }, // Adăugat aici
}, { timestamps: true });

const Quiz = mongoose.model('Quiz', QuizSchema);
export default Quiz;