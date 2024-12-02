import mongoose from 'mongoose';


const QuizSchema = new mongoose.Schema({
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    questions: [
        {
            questionText: { type: String, required: true },
            sentenceIDs: [{ type: String }], // Adăugat array de sentence IDs
            options: [{
                text: String,
                isCorrect: { type: Boolean, default: false } // Adăugat flag pentru răspunsul corect
            }],
        },
    ],
    approved: { type: Boolean, default: false },
}, { timestamps: true });

const Quiz = mongoose.model('Quiz', QuizSchema);
export default Quiz;
