// routes/teacherRoutes.js
import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { createLesson, uploadPDF, addGrades } from '../controllers/teacherController.js';
import upload from '../middleware/uploadMiddleware.js';
import { getQuizStatistics, getQuizFeedback } from '../controllers/teacherController.js';
const router = express.Router();

// Rute pentru profesori
router.post('/lessons', protect, authorizeRoles('teacher'), createLesson);
router.post('/lessons/:id/upload', protect, authorizeRoles('teacher'), upload.single('pdf'), uploadPDF);
router.post('/lessons/:lessonId/grades', protect, authorizeRoles('teacher'), addGrades);
router.get('/quizzes/:quizId/statistics', protect, authorizeRoles('teacher'), getQuizStatistics);
router.get('/quizzes/:quizId/feedback', protect, authorizeRoles('teacher'), getQuizFeedback);
export default router;