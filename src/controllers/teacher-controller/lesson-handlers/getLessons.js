import Lesson from '../../../models/Lesson.js';

import { config } from 'dotenv';


config();

const getLessons = async (req, res) => {
    try {
        const { date } = req.query;
        const teacherId = req.user.id;

        if (!date) {
            return res.status(400).json({ message: 'Data este necesară' });
        }

        const formattedDate = new Date(date);
        if (isNaN(formattedDate)) {
            return res.status(400).json({ message: 'Data este invalidă' });
        }

        const lessons = await Lesson.find({
            teacher: teacherId,
            date: {
                $gte: new Date(formattedDate.setHours(0, 0, 0, 0)),
                $lte: new Date(formattedDate.setHours(23, 59, 59, 999)),
            },
        }).populate('class');

        res.json(lessons);
    } catch (error) {
        console.error('Eroare la obținerea lecțiilor:', error);
        res.status(500).json({ message: 'Eroare de server' });
    }
};

export default getLessons;
