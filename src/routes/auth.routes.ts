import express from 'express';
import { register, login, logout, getMe } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = express.Router();

router.post('/register', validate('register'), register);
router.post('/login', validate('login'), login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;
