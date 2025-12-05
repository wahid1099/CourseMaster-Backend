import express from "express";
import {
  getStudentDashboard,
  getCourseForLearning,
  markLessonComplete,
  getEnrollmentProgress,
} from "../controllers/student.controller";
import { enrollInCourse } from "../controllers/enrollment.controller";
import { protect, authorize } from "../middleware/auth.middleware";

const router = express.Router();

// All routes require student authentication
router.use(protect);
router.use(authorize("student"));

// Dashboard
router.get("/dashboard", getStudentDashboard);

// Course Learning
router.get("/course/:id/learn", getCourseForLearning);

// Progress Tracking
router.put("/enrollments/:id/lesson/complete", markLessonComplete);
router.get("/enrollments/:id/progress", getEnrollmentProgress);

// Enrollment
router.post("/enroll/:id", enrollInCourse);

export default router;
