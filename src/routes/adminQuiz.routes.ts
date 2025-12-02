import express from 'express';
import {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getAllQuizzesAdmin,
  getQuizByIdAdmin
} from '../controllers/adminQuiz.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require admin/teacher authentication
router.use(protect);
router.use(authorize('admin', 'teacher', 'instructor'));

// Quiz management routes
router.post('/', createQuiz);
router.get('/', getAllQuizzesAdmin);
router.get('/:id', getQuizByIdAdmin);
router.put('/:id', updateQuiz);
router.delete('/:id', deleteQuiz);

export default router;
