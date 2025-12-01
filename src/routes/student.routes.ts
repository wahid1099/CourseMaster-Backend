import express from 'express';
import {
  getDashboard,
  enrollCourse,
  getCourseContent,
  markLessonComplete,
  submitAssignment,
  takeQuiz
} from '../controllers/student.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = express.Router();

// All routes are protected and for students only
router.use(protect);
router.use(authorize('student'));

router.get('/dashboard', getDashboard);
router.post('/enroll/:courseId', enrollCourse);
router.get('/courses/:courseId', getCourseContent);
router.post('/progress', markLessonComplete);
router.post('/assignments', validate('assignment'), submitAssignment);
router.post('/quizzes/:quizId/attempt', takeQuiz);

export default router;
