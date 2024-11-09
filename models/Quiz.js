// models/Quiz.js
import mongoose from 'mongoose';

const OptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
});

const QuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [OptionSchema],
  correctAnswer: { type: String, required: true },
});

const QuizSchema = new mongoose.Schema({
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  questions: [QuestionSchema],
});

const Quiz = mongoose.model('Quiz', QuizSchema);
export default Quiz;