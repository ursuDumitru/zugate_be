import Quiz from '../../../models/Quiz.js';

import { config } from 'dotenv';

config();


const approveQuiz = async (req, res) => {
    try {
        // Obține id-ul quiz-ului și id-ul profesorului
        const { quizId } = req.params;
        const teacherId = req.user.id;

        // Verifică dacă quiz-ul există și dacă profesorul are permisiunea de a-l aproba
        const quiz = await Quiz.findById(quizId).populate('lesson');
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz-ul nu a fost găsit' });
        }

        // Verifică dacă profesorul are permisiunea de a aproba quiz-ul
        if (quiz.lesson.teacher.toString() !== teacherId) {
            return res.status(403).json({ message: 'Nu aveți permisiunea de a aproba acest quiz' });
        }

        // Aprobă quiz-ul
        quiz.approved = true;
        await quiz.save();
        res.json({ message: 'Quiz-ul a fost aprobat', quiz });
    } catch (error) {
        console.error('Eroare la aprobarea quiz-ului:', error);
        res.status(500).json({ message: 'Eroare de server' });
    }
};

export default approveQuiz;
