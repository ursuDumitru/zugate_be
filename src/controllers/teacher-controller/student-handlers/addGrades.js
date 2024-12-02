import Lesson from '../../../models/Lesson.js';
import Grade from '../../../models/Grade.js';

import { config } from 'dotenv';


config();

const addGrades = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { grades } = req.body;
        const teacherId = req.user.id;

        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'Lecția nu a fost găsită' });
        }

        if (lesson.teacher.toString() !== teacherId) {
            return res.status(403).json({ message: 'Nu aveți permisiunea de a modifica această lecție' });
        }

        const gradePromises = grades.map(async ({ studentId, grade, note }) => {
            const gradeRecord = new Grade({
                student: studentId,
                lesson: lesson._id,
                grade,
                note // adăugat câmpul note
            });
            return gradeRecord.save();
        });

        await Promise.all(gradePromises);
        res.json({ message: 'Calificative și notițe adăugate cu succes' });
    } catch (error) {
        console.error('Eroare la adăugarea calificativelor:', error);
        res.status(500).json({ message: 'Eroare de server' });
    }
};

export default addGrades;
