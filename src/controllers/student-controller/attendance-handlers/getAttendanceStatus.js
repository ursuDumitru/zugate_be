import Attendance from '../../../models/Attendance.js';


const getAttendanceStatus = async (req, res) => {
    try {
        // Verificăm dacă elevul este prezent la lecție
        const attendance = await Attendance.findOne({
            student: req.user.id,
            lesson: req.params.id
        });

        // Returnăm statusul prezenței
        res.json({ attended: attendance ? attendance.attended : false });
    } catch (error) {
        console.error('Eroare la verificarea prezenței:', error);
        res.status(500).json({ message: 'Eroare la verificarea prezenței' });
    }
};

export default getAttendanceStatus;
