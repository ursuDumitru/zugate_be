import Lesson from '../../../models/Lesson.js';
import Quiz from '../../../models/Quiz.js';

import { config } from 'dotenv';


config();

const getQuizzes = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const teacherId = req.user.id;

        // Verificăm lecția
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'Lecția nu a fost găsită' });
        }

        // Verificăm dacă profesorul are permisiunea de a accesa quiz-urile
        if (lesson.teacher.toString() !== teacherId) {
            return res.status(403).json({ message: 'Nu aveți permisiunea de a accesa această lecție' });
        }

        // Obținem quiz-urile
        const quizzes = await Quiz.find({ lesson: lessonId });
        res.json({ quizzes });
    } catch (error) {
        console.error('Eroare la obținerea quiz-urilor:', error);
        res.status(500).json({ message: 'Eroare de server' });
    }
};

export default getQuizzes;