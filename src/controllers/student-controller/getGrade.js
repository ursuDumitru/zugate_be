import Lesson from '../../models/Lesson.js';
import User from '../../models/User.js';
import Grade from '../../models/Grade.js';


const getGrade = async (req, res) => {
    try {
        const { lessonId } = req.params;

        // Găsește studentul și clasa sa
        const student = await User.findById(req.user.id).populate('class');
        if (!student) {
            return res.status(404).json({ message: 'Elevul nu a fost găsit.' });
        }

        // Găsește lecția și verifică dacă aparține clasei studentului
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'Lecția nu a fost găsită.' });
        }

        if (lesson.class.toString() !== student.class._id.toString()) {
            return res.status(403).json({ message: 'Nu aveți acces la această lecție.' });
        }

        // Caută nota pentru student și lecție
        const grade = await Grade.findOne({
            student: req.user.id,
            lesson: lessonId
        });

        if (!grade) {
            return res.status(404).json({ message: 'Încă nu există o notă pentru această lecție.' });
        }

        res.json({ grade: grade.grade, note: grade.note });
    } catch (error) {
        console.error('Eroare la obținerea notei:', error);
        res.status(500).json({ message: 'Eroare de server la obținerea notei.' });
    }
};

export default getGrade;
