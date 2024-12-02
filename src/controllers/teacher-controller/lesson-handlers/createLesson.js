import Lesson from '../../../models/Lesson.js';
import Class from '../../../models/Class.js';

import { config } from 'dotenv';


config();

const createLesson = async (req, res) => {
    try {
        const { title, description, date, time, className } = req.body;
        const teacherId = req.user.id;

        const lessonClass = await Class.findOne({ name: className });
        if (!lessonClass) {
            return res.status(404).json({ message: 'Clasa nu a fost găsită' });
        }

        const lesson = new Lesson({
            title,
            description,
            date,
            time,
            teacher: teacherId,
            class: lessonClass._id,
            quizzes: [] // Inițializăm cu un array gol
        });

        await lesson.save();
        res.status(201).json({ message: 'Lecție creată', lessonId: lesson._id });
    } catch (error) {
        console.error('Eroare la crearea lecției:', error);
        res.status(500).json({ message: 'Eroare de server' });
    }
};

export default createLesson;