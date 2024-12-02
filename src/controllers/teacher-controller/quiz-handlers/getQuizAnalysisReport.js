import Quiz from '../../../models/Quiz.js';
import AIAnalysisReport from '../../../models/AIAnalysisReport.js';

import { config } from 'dotenv';


config();

const getQuizAnalysisReport = async (req, res) => {
    try {
        // Obține id-ul quiz-ului și id-ul profesorului
        const { quizId } = req.params;
        const teacherId = req.user.id;

        // Verifică dacă quiz-ul există
        const quiz = await Quiz.findById(quizId).populate('lesson');
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz-ul nu a fost găsit' });
        }

        // Verifică dacă profesorul are permisiunea de a accesa raportul de analiză
        if (quiz.lesson.teacher.toString() !== teacherId) {
            return res.status(403).json({ message: 'Nu aveți permisiunea de a accesa această analiză' });
        }

        // Obține raportul de analiză
        const report = await AIAnalysisReport.findOne({ quiz: quizId });
        if (!report) {
            return res.status(404).json({
                message: 'Raportul de analiză nu a fost găsit',
                status: 'NOT_FOUND'
            });
        }

        // Returnează raportul
        res.json({ report });
    } catch (error) {
        console.error('Error in getQuizAnalysisReport:', error);
        res.status(500).json({ message: 'Eroare de server' });
    }
};

export default getQuizAnalysisReport;
