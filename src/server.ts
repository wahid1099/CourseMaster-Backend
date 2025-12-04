import express, { Application } from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import courseRoutes from "./routes/course.routes";
import studentRoutes from "./routes/student.routes";
import adminRoutes from "./routes/admin.routes";
import userRoutes from "./routes/user.routes";
import enrollmentRoutes from "./routes/enrollment.routes";
import assignmentRoutes from "./routes/assignment.routes";
import adminAssignmentRoutes from "./routes/adminAssignment.routes";
import quizRoutes from "./routes/quiz.routes";
import adminQuizRoutes from "./routes/adminQuiz.routes";
import chatRoutes from "./routes/chat.routes";
import { errorHandler } from "./middleware/error.middleware";
import redisClient from "./utils/redis.util";

// Load env vars
dotenv.config();

const app: Application = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Enable CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "https://misun-academy.netlify.app",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Connect to MongoDB
const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/coursemaster"
    );
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Connect to Redis
const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.log("⚠️  Redis connection failed, continuing without caching");
  }
};

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/users", userRoutes);
app.use("/api/admin/enrollments", enrollmentRoutes);
app.use("/api/admin/assignments", adminAssignmentRoutes);
app.use("/api/admin/quizzes", adminQuizRoutes);
app.use("/api/student/assignments", assignmentRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/chat", chatRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "Server is running" });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  await connectDB();
  await connectRedis();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  });
};

startServer();

export default app;
