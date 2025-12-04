import express from "express";
import {
  getChatHistory,
  getRecentChats,
  markMessagesAsRead,
  getSupportAgents,
  sendMessage,
} from "../controllers/chat.controller";
import { protect, authorize } from "../middleware/auth.middleware";

const router = express.Router();

// Get chat history with a specific user
router.get("/history/:userId", protect, getChatHistory);

// Get recent chats (for instructors/admins)
router.get(
  "/recent",
  protect,
  authorize("admin", "instructor"),
  getRecentChats
);

// Get available support agents
router.get("/support-agents", protect, getSupportAgents);

// Send a message
router.post("/send", protect, sendMessage);

// Mark messages as read
router.put("/read/:userId", protect, markMessagesAsRead);

export default router;
