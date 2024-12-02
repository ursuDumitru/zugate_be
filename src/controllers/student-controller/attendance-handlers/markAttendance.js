import Lesson from '../../../models/Lesson.js';
import User from '../../../models/User.js';
import Attendance from '../../../models/Attendance.js';


const markAttendance = async (req, res) => {
    try {
        // Verifică dacă lecția există
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) {
            return res.status(404).json({ message: 'Lecția nu a fost găsită' });
        }

        // Verifică dacă studentul are acces la lecție
        const student = await User.findById(req.user.id).populate('class');
        if (!student || lesson.class.toString() !== student.class._id.toString()) {
            return res.status(403).json({ message: 'Nu aveți acces la această lecție' });
        }

        // Verifică dacă prezența a fost deja marcată
        let attendance = await Attendance.findOne({
            student: req.user.id,
            lesson: lesson._id
        });

        if (attendance) {
            // Dacă prezența a fost marcată, returnează eroare
            if (attendance.attended) {
                return res.status(400).json({ message: 'Prezența a fost deja marcată și nu poate fi modificată.' });
            } else {
                // În cazul în care înregistrarea există dar nu este marcată ca prezentă, permite marcarea
                attendance.attended = true;
                await attendance.save();

                // Returnează mesajul de succes și statusul prezenței
                return res.json({
                    message: 'Prezență marcată cu succes',
                    attended: attendance.attended
                });
            }
        }

        // Dacă nu există, creează o nouă înregistrare cu prezența marcată
        attendance = new Attendance({
            student: req.user.id,
            lesson: lesson._id,
            attended: true
        });

        await attendance.save();

        // Returnează mesajul de succes și statusul prezenței
        res.json({ message: 'Prezență marcată cu succes', attended: true });
    } catch (error) {
        console.error('Eroare la marcarea prezenței:', error);
        res.status(500).json({ message: 'Eroare la marcarea prezenței' });
    }
};

export default markAttendance;