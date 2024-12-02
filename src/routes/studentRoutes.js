import authorizeRoles from '../middleware/authorizeRoles.js';
import protectMiddleware from '../middleware/protectMiddleware.js';
import getSchedule from '../controllers/student-controller/getSchedule.js';
import getLesson from '../controllers/student-controller/getLesson.js';
import submitQuiz from '../controllers/student-controller/quiz-handlers/submitQuiz.js';
import submitFeedback from '../controllers/student-controller/submitFeedback.js';
import markAttendance from '../controllers/student-controller/attendance-handlers/markAttendance.js';
import getQuiz from '../controllers/student-controller/quiz-handlers/getQuiz.js';
import getAttendanceStatus from '../controllers/student-controller/attendance-handlers/getAttendanceStatus.js';
import getGrade from '../controllers/student-controller/getGrade.js';

import express from 'express';


const router = express.Router();

router.get('/schedule', protectMiddleware, authorizeRoles('student'), getSchedule);

router.post('/quizzes/:id/submit', protectMiddleware, authorizeRoles('student'), submitQuiz);
router.get('/quizzes/:id', protectMiddleware, authorizeRoles('student'), getQuiz);

router.get('/lessons/:id', protectMiddleware, authorizeRoles('student'), getLesson);
router.post('/lessons/:id/feedback', protectMiddleware, authorizeRoles('student'), submitFeedback);
router.post('/lessons/:id/attendance', protectMiddleware, authorizeRoles('student'), markAttendance);
router.get('/lessons/:id/attendance', protectMiddleware, authorizeRoles('student'), getAttendanceStatus);
router.get('/lessons/:lessonId/grade', protectMiddleware, authorizeRoles('student'), getGrade);

export default router;