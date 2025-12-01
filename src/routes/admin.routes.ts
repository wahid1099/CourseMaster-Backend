import { Router } from 'express';
import {
  getCourseEnrollments,
  getAssignments,
  reviewAssignment,
  getAnalytics
} from '../controllers/admin.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes are protected and for admins only
router.use(protect);
router.use(authorize('admin'));

router.get('/courses/:courseId/enrollments', getCourseEnrollments);
router.get('/assignments', getAssignments);
router.put('/assignments/:id/review', reviewAssignment);
router.get('/analytics', getAnalytics);

export default router;
