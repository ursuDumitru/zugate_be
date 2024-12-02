import authorizeRoles from '../middleware/authorizeRoles.js';
import protectMiddleware from '../middleware/protectMiddleware.js';
import savePdf from '../controllers/teacher-controller/pdf-handlers/savePdf.mjs';
import createLesson from '../controllers/teacher-controller/lesson-handlers/createLesson.js';
import getLessons from '../controllers/teacher-controller/lesson-handlers/getLessons.js';
import uploadPDF from '../controllers/teacher-controller/pdf-handlers/uploadPDF.js';
import addGrades from '../controllers/teacher-controller/student-handlers/addGrades.js';
import getPresentStudents from '../controllers/teacher-controller/student-handlers/getPresentStudents.js';
import generateQuizAnalysis from '../controllers/teacher-controller/quiz-handlers/generateQuizAnalysis.js';
import getQuizzes from '../controllers/teacher-controller/quiz-handlers/getQuizzes.js';
import getQuizAnalysisReport from '../controllers/teacher-controller/quiz-handlers/getQuizAnalysisReport.js';
import updateQuiz from '../controllers/teacher-controller/quiz-handlers/updateQuiz.js';
import approveQuiz from '../controllers/teacher-controller/quiz-handlers/approveQuiz.js';
import getFeedback from '../controllers/teacher-controller/feedback-handlers/getFeedback.js';

import express from 'express';


const router = express.Router();

router.post('/lessons', protectMiddleware, authorizeRoles('teacher'), createLesson);
router.get('/lessons', protectMiddleware, authorizeRoles('teacher'), getLessons);
router.post('/lessons/:id/upload', protectMiddleware, authorizeRoles('teacher'), savePdf.single('pdf'), uploadPDF);
router.post('/lessons/:lessonId/grades', protectMiddleware, authorizeRoles('teacher'), addGrades);
router.get('/lessons/:lessonId/quizzes', protectMiddleware, authorizeRoles('teacher'), getQuizzes);
router.get('/lessons/:lessonId/students', protectMiddleware, authorizeRoles('teacher'), getPresentStudents);

router.put('/quizzes/:quizId', protectMiddleware, authorizeRoles('teacher'), updateQuiz);
router.post('/quizzes/:quizId/approve', protectMiddleware, authorizeRoles('teacher'), approveQuiz);
router.post('/quizzes/:quizId/generate_analyze', protectMiddleware, authorizeRoles('teacher'), generateQuizAnalysis);
router.get('/quizzes/:quizId/analyze', protectMiddleware, authorizeRoles('teacher'), getQuizAnalysisReport);

router.get('/feedback', protectMiddleware, authorizeRoles('teacher'), getFeedback);

export default router;