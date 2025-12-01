import express from 'express';
import {
  getAllEnrollments,
  getEnrollmentsByCourse,
  getEnrollmentsByBatch,
  getEnrollmentStats,
  getEnrollmentById
} from '../controllers/enrollment.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin', 'moderator'));

// Enrollment routes
router.get('/', getAllEnrollments);
router.get('/stats', getEnrollmentStats);
router.get('/course/:id', getEnrollmentsByCourse);
router.get('/batch/:name', getEnrollmentsByBatch);
router.get('/:id', getEnrollmentById);

export default router;
