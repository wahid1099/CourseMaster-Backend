import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  changeUserRole,
  getUserStats
} from '../controllers/user.controller';
import { validate } from '../middleware/validation.middleware';

const router = express.Router();

// All routes require authentication and admin/moderator role
router.use(protect);
router.use(authorize('admin', 'moderator'));

// User statistics
router.get('/stats', getUserStats);

// CRUD operations
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', validate('createUser'), createUser);
router.put('/:id', validate('updateUser'), updateUser);

// Admin only routes
router.delete('/:id', authorize('admin'), deleteUser);
router.patch('/:id/role', authorize('admin'), changeUserRole);

// Status toggle (admin and moderator)
router.patch('/:id/status', toggleUserStatus);

export default router;
