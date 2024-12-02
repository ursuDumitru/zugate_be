import Quiz from '../../../models/Quiz.js';
import StudentQuizResult from '../../../models/StudentQuizResult.js';


const submitQuiz = async (req, res) => {
    try {
        // Obține quiz-ul
        const quiz = await Quiz.findById(req.params.id).populate('lesson');
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz-ul nu a fost găsit' });
        }

        const { answers } = req.body;
        const processedAnswers = [];
        let score = 0;
        let correctAnswers = 0;

        // Verifică fiecare răspuns și calculează scorul
        for (const answer of answers) {
            const question = quiz.questions.id(answer.questionId);
            if (question) {
                const correctOption = question.options.find(opt => opt.isCorrect);
                const isCorrect = answer.selectedOption === correctOption.text;
                if (isCorrect) {
                    score += 1;
                    correctAnswers += 1;
                }
                processedAnswers.push({
                    questionId: question._id,
                    questionText: question.questionText,
                    selectedAnswer: answer.selectedOption,
                    correctAnswer: correctOption.text,
                    isCorrect,
                    sentenceIDs: question.sentenceIDs
                });
            }
        }

        // Calculează scorul procentual
        const totalQuestions = quiz.questions.length;
        const percentageScore = (score / totalQuestions) * 100;

        // Salvează rezultatul în StudentQuizResult
        const studentQuizResult = new StudentQuizResult({
            student: req.user.id,
            quiz: quiz._id,
            lesson: quiz.lesson._id,
            answers: processedAnswers,
            score: percentageScore,
        });

        await studentQuizResult.save();

        // Returnează mesajul de succes
        res.json({
            message: 'Quiz trimis',
            score: percentageScore,
            correctAnswers,
            totalQuestions
        });
    } catch (error) {
        console.error('Eroare la trimiterea quiz-ului:', error);
        res.status(500).json({ message: 'Eroare de server' });
    }
};

export default submitQuiz;
