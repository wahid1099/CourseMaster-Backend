import express from 'express';
import { getCourses, getCourse, createCourse, updateCourse, deleteCourse, getCategories } from '../controllers/course.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = express.Router();

// Public routes
router.get('/', getCourses);
router.get('/categories', getCategories);
router.get('/:id', getCourse);

// Admin routes
router.post('/', protect, authorize('admin', 'teacher'), validate('course'), createCourse);
router.put('/:id', protect, authorize('admin', 'teacher'), validate('course'), updateCourse);
router.delete('/:id', protect, authorize('admin'), deleteCourse);

export default router;
