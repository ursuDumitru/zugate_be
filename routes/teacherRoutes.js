// routes/teacherRoutes.js
import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  createLesson,
  uploadPDF,
  addGrades,
  getLessons,
  generateQuizAnalysis,
  getQuizzes,
  getQuizAnalysisReport,
  updateQuiz,
  approveQuiz,
} from '../controllers/teacherController.js';
import upload from '../src/preprocess-pdf/upload-pdf.mjs';

const router = express.Router();

// Rute pentru profesori
router.post('/lessons', protect, authorizeRoles('teacher'), createLesson);
router.get('/lessons', protect, authorizeRoles('teacher'), getLessons);
router.post('/lessons/:id/upload', protect, authorizeRoles('teacher'), upload.single('pdf'), uploadPDF);
router.post('/lessons/:lessonId/grades', protect, authorizeRoles('teacher'), addGrades);
router.get('/lessons/:lessonId/quizzes', protect, authorizeRoles('teacher'), getQuizzes); // Noua rută pentru obținerea quiz-urilor
router.put('/quizzes/:quizId', protect, authorizeRoles('teacher'), updateQuiz); // Noua rută pentru actualizarea quiz-ului
router.post('/quizzes/:quizId/approve', protect, authorizeRoles('teacher'), approveQuiz); // Noua rută pentru aprobarea quiz-ului
router.post('/quizzes/:quizId/generate_analyze', protect, authorizeRoles('teacher'), generateQuizAnalysis);
router.get('/quizzes/:quizId/analyze',protect, authorizeRoles('teacher'), getQuizAnalysisReport);

export default router;