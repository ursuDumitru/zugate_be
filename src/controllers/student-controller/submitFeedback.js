import Lesson from '../../models/Lesson.js';
import User from '../../models/User.js';
import Feedback from '../../models/Feedback.js';


const submitFeedback = async (req, res) => {
    try {
        // Obține lecția
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) {
            return res.status(404).json({ message: 'Lecția nu a fost găsită' });
        }

        // Verifică dacă studentul are acces la lecție
        const student = await User.findById(req.user.id).populate('class');
        if (!student || lesson.class.toString() !== student.class._id.toString()) {
            return res.status(403).json({ message: 'Nu aveți acces la această lecție' });
        }

        const { feedbackText } = req.body;

        // Creează feedback-ul
        const feedback = new Feedback({
            student: req.user.id,
            lesson: lesson._id,
            feedbackText,
        });

        await feedback.save();

        // Returnează mesajul de succes
        res.json({ message: 'Feedback trimis' });
    } catch (error) {
        console.error('Eroare la trimiterea feedback-ului:', error);
        res.status(500).json({ message: 'Eroare de server' });
    }
};

export default submitFeedback;
