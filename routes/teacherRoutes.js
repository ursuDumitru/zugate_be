// routes/teacherRoutes.js
import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  createLesson,
  uploadPDF,
  addGrades,
  getLessons,
  getQuizStatistics,
  getQuizFeedback,
  getQuizzes,
  updateQuiz,
  approveQuiz,
} from '../controllers/teacherController.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Rute pentru profesori
router.post('/lessons', protect, authorizeRoles('teacher'), createLesson);
router.get('/lessons', protect, authorizeRoles('teacher'), getLessons);
router.post('/lessons/:id/upload', protect, authorizeRoles('teacher'), upload.single('pdf'), uploadPDF);
router.post('/lessons/:lessonId/grades', protect, authorizeRoles('teacher'), addGrades);
router.get('/lessons/:lessonId/quizzes', protect, authorizeRoles('teacher'), getQuizzes); // Noua rută pentru obținerea quiz-urilor
router.put('/quizzes/:quizId', protect, authorizeRoles('teacher'), updateQuiz); // Noua rută pentru actualizarea quiz-ului
router.post('/quizzes/:quizId/approve', protect, authorizeRoles('teacher'), approveQuiz); // Noua rută pentru aprobarea quiz-ului
router.get('/quizzes/:quizId/statistics', protect, authorizeRoles('teacher'), getQuizStatistics);
router.get('/quizzes/:quizId/feedback', protect, authorizeRoles('teacher'), getQuizFeedback);

export default router;