import express from 'express';
import {
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  reviewAssignment,
  getAssignmentStats
} from '../controllers/adminAssignment.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require admin/instructor authentication
router.use(protect);
router.use(authorize('admin', 'instructor', 'teacher'));

// Assignment management routes
router.post('/', createAssignment);
router.get('/', getAllAssignments);
router.get('/stats', getAssignmentStats);
router.get('/:id', getAssignmentById);
router.put('/:id', updateAssignment);
router.delete('/:id', deleteAssignment);
router.post('/:id/review', reviewAssignment);

export default router;
