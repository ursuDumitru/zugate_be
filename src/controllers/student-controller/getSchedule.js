import Lesson from '../../models/Lesson.js';
import User from '../../models/User.js';


const getSchedule = async (req, res) => {
    try {
        // Obține orarul elevului
        const student = await User.findById(req.user.id).populate('class');

        // Verifică dacă elevul există
        if (!student) {
            return res.status(404).json({ message: 'Elevul nu a fost găsit' });
        }

        // Obține lecțiile din orar
        const lessons = await Lesson.find({ class: student.class._id })
            .populate('teacher', 'name')
            .sort({ date: 1, time: 1 });

        // Returnează orarul
        res.json({ schedule: lessons });
    } catch (error) {
        console.error('Eroare la obținerea orarului:', error);
        res.status(500).json({ message: 'Eroare de server' });
    }
};

export default getSchedule;
