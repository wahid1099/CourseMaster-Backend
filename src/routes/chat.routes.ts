import express from 'express';
import { getChatHistory, getRecentChats, markMessagesAsRead, getSupportAgents } from '../controllers/chat.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// Get chat history with a specific user
router.get('/history/:userId', protect, getChatHistory);

// Get recent chats (for instructors/admins)
router.get('/recent', protect, authorize('admin', 'instructor'), getRecentChats);

// Get available support agents
router.get('/support-agents', protect, getSupportAgents);

// Mark messages as read
router.put('/read/:userId', protect, markMessagesAsRead);

export default router;
