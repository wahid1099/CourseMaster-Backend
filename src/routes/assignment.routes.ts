import express from "express";
import {
  getAllAssignments,
  getAssignmentsByCourse,
  getPendingAssignments,
  getAssignmentById,
  reviewAssignment,
  getAssignmentStats,
  submitAssignment,
} from "../controllers/assignment.controller";
import { protect, authorize } from "../middleware/auth.middleware";

const router = express.Router();

// All routes require authentication (students can access their own assignments)
router.use(protect);
router.use(authorize("admin", "moderator", "teacher", "student"));

// Assignment routes
router.get("/", getAllAssignments);
router.get("/stats", getAssignmentStats);
router.get("/pending", getPendingAssignments);
router.get("/course/:id", getAssignmentsByCourse);
router.get("/:id", getAssignmentById);
router.post("/", submitAssignment); // Student submission
router.put("/:id/review", reviewAssignment);

export default router;
