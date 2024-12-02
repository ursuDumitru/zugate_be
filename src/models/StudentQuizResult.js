import mongoose from 'mongoose';


const StudentQuizResultSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    score: { type: Number, required: true },
    answers: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
        questionText: { type: String, required: true },
        selectedAnswer: { type: String, required: true },
        correctAnswer: { type: String, required: true },
        isCorrect: { type: Boolean, required: true },
        sentenceIDs: [{ type: String }] // Referințe la propozițiile relevante
    }],
    completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const StudentQuizResult = mongoose.model('StudentQuizResult', StudentQuizResultSchema);
export default StudentQuizResult;