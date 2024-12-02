import Lesson from '../../models/Lesson.js';
import User from '../../models/User.js';
import StudentQuizResult from '../../models/StudentQuizResult.js';


const getLesson = async (req, res) => {
    try {
        // Obține lecția și quiz-ul asociat
        const lesson = await Lesson.findById(req.params.id)
            .populate('teacher', 'name')
            .populate({
                path: 'quizzes',
                match: { approved: true },
            });

        // Verifică dacă lecția există
        if (!lesson) {
            return res.status(404).json({ message: 'Lecția nu a fost găsită' });
        }

        // Verifică dacă studentul are acces la lecție
        const student = await User.findById(req.user.id).populate('class');
        if (!student || lesson.class.toString() !== student.class._id.toString()) {
            return res.status(403).json({ message: 'Nu aveți acces la această lecție' });
        }

        // Verifică dacă studentul a completat quiz-ul
        const completedQuiz = await StudentQuizResult.findOne({
            student: req.user.id,
            quiz: lesson.quizzes[0]?._id,
        });

        // Dacă quiz-ul a fost completat, elimină-l din răspuns
        if (completedQuiz) {
            lesson.quizzes = [];
        }

        // Returnează lecția
        res.json({ lesson });
    } catch (error) {
        console.error('Eroare la obținerea lecției:', error);
        res.status(500).json({ message: 'Eroare de server' });
    }
};

export default getLesson;