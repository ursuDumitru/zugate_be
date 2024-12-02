import Grade from '../../../models/Grade.js';
import Attendance from '../../../models/Attendance.js';

import { config } from 'dotenv';


config();

const getPresentStudents = async (req, res) => {
    try {
        const { lessonId } = req.params;

        // Găsim toate înregistrările de prezență pentru lecția dată unde attended este true
        const attendanceRecords = await Attendance.find({ lesson: lessonId, attended: true })
            .populate('student', 'name') // Populăm doar numele studentului
            .lean();

        const studentIds = attendanceRecords.map(record => record.student._id);

        // Găsim notele pentru studenții prezenți la lecția respectivă
        const grades = await Grade.find({ lesson: lessonId, student: { $in: studentIds } })
            .lean();

        // Creăm un map pentru a accesa rapid gradele după ID-ul studentului
        const gradeMap = grades.reduce((acc, grade) => {
            acc[grade.student.toString()] = {
                grade: grade.grade,
                note: grade.note,
            };
            return acc;
        }, {});

        // Extragem informațiile necesare pentru frontend
        const presentStudents = attendanceRecords.map(record => ({
            id: record.student._id,
            name: record.student.name,
            grade: gradeMap[record.student._id.toString()]?.grade || null,
            note: gradeMap[record.student._id.toString()]?.note || null,
            attendanceDate: record.date, // Data prezenței
        }));

        res.json(presentStudents);
    } catch (error) {
        console.error('Eroare la obținerea studenților prezenți:', error);
        res.status(500).json({ message: 'Eroare de server la obținerea studenților prezenți' });
    }
};

export default getPresentStudents;