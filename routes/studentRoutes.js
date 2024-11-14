// routes/studentRoutes.js
import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { getSchedule, getLesson, submitQuiz, getQuiz  , getGrade ,submitFeedback, markAttendance, getAttendanceStatus} from '../controllers/studentController.js';

const router = express.Router();

// Rute pentru elevi
router.get('/schedule', protect, authorizeRoles('student'), getSchedule);
router.get('/lessons/:id', protect, authorizeRoles('student'), getLesson);
router.post('/quizzes/:id/submit', protect, authorizeRoles('student'), submitQuiz);
router.post('/lessons/:id/feedback', protect, authorizeRoles('student'), submitFeedback);
router.post('/lessons/:id/attendance', protect, authorizeRoles('student'), markAttendance);
router.get('/quizzes/:id', protect, authorizeRoles('student'), getQuiz);
router.post('/lessons/:id/attendance', protect, authorizeRoles('student'), getAttendanceStatus);
router.get('/lessons/:lessonId/grade', protect, authorizeRoles('student'), getGrade); // Noua rută pentru preluarea notei
export default router;