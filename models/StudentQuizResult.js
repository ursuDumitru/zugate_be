// StudentQuizResult Schema
import mongoose from 'mongoose';

const StudentQuizResultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  score: { type: Number, required: true },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    questionText: { type: String, required: true },
    selectedAnswer: { type: String, required: true },
    correctAnswer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true }
  }],
  completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const StudentQuizResult = mongoose.model('StudentQuizResult', StudentQuizResultSchema);
export default StudentQuizResult;

// Controller pentru procesarea răspunsurilor
export const submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const studentId = req.user.id;
    const { answers } = req.body;

    // Găsim quiz-ul complet cu toate detaliile
    const quiz = await Quiz.findById(quizId).populate('lesson');
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz-ul nu a fost găsit' });
    }

    // Procesăm răspunsurile și adăugăm toate informațiile necesare pentru analiză
    let correctAnswers = 0;
    const processedAnswers = quiz.questions.map((question, index) => {
      const studentAnswer = answers.find(a => a.questionId === question._id.toString());
      const isCorrect = studentAnswer?.selectedOption === question.correctAnswer;
      
      if (isCorrect) {
        correctAnswers++;
      }

      return {
        questionId: question._id,
        questionText: question.questionText,
        selectedAnswer: studentAnswer?.selectedOption || '',
        correctAnswer: question.correctAnswer,
        isCorrect: isCorrect
      };
    });

    const score = (correctAnswers / quiz.questions.length) * 100;

    // Creăm înregistrarea rezultatului cu toate detaliile necesare pentru analiză
    const quizResult = new StudentQuizResult({
      student: studentId,
      quiz: quizId,
      score: score,
      answers: processedAnswers
    });

    await quizResult.save();

    // Returnăm rezultatul către client
    res.json({
      message: 'Quiz completat cu succes',
      score: score,
      totalQuestions: quiz.questions.length,
      correctAnswers: correctAnswers,
      details: processedAnswers.map(answer => ({
        questionText: answer.questionText,
        isCorrect: answer.isCorrect,
        yourAnswer: answer.selectedAnswer,
        correctAnswer: answer.correctAnswer
      }))
    });

  } catch (error) {
    console.error('Eroare la trimiterea quiz-ului:', error);
    res.status(500).json({ 
      message: 'Eroare la salvarea rezultatelor quiz-ului',
      error: error.message 
    });
  }
};