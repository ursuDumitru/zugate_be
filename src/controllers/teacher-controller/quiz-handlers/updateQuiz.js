import Quiz from '../../../models/Quiz.js';

import { config } from 'dotenv';


config();

const updateQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const teacherId = req.user.id;
        const { questions } = req.body;

        // Verificăm quiz-ul
        const quiz = await Quiz.findById(quizId).populate('lesson');
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz-ul nu a fost găsit' });
        }

        // Verificăm dacă profesorul are permisiunea de a modifica quiz-ul
        if (quiz.lesson.teacher.toString() !== teacherId) {
            return res.status(403).json({ message: 'Nu aveți permisiunea de a modifica acest quiz' });
        }

        // Actualizăm quiz-ul
        quiz.questions = questions.map(q => ({
            questionText: q.questionText,
            options: q.options,
            correctAnswer: q.correctAnswer,
        }));
        quiz.approved = false;

        // Salvăm quiz-ul
        await quiz.save();
        res.json({ message: 'Quiz-ul a fost actualizat', quiz });
    } catch (error) {
        console.error('Eroare la actualizarea quiz-ului:', error);
        res.status(500).json({ message: 'Eroare de server' });
    }
};

export default updateQuiz;
