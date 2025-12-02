import express from 'express';
import {
  getQuizzesByCourse,
  getQuizById,
  submitQuiz,
  getQuizHistory,
  getQuizResult
} from '../controllers/quiz.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require student authentication
router.use(protect);
router.use(authorize('student'));

// Quiz routes
router.get('/course/:courseId', getQuizzesByCourse);
router.get('/history', getQuizHistory);
router.get('/:id', getQuizById);
router.post('/:id/submit', submitQuiz);
router.get('/result/:id', getQuizResult);

export default router;
