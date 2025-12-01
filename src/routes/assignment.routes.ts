import express from 'express';
import {
  getAllAssignments,
  getAssignmentsByCourse,
  getPendingAssignments,
  getAssignmentById,
  reviewAssignment,
  getAssignmentStats
} from '../controllers/assignment.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require admin/moderator authentication
router.use(protect);
router.use(authorize('admin', 'moderator', 'teacher'));

// Assignment routes
router.get('/', getAllAssignments);
router.get('/stats', getAssignmentStats);
router.get('/pending', getPendingAssignments);
router.get('/course/:id', getAssignmentsByCourse);
router.get('/:id', getAssignmentById);
router.put('/:id/review', reviewAssignment);

export default router;
