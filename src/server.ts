import express, { Application, Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.config";
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

// API Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Misun Academy API Documentation",
  })
);

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Welcome Message
 *     description: Returns welcome message and API information
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Welcome message with API details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Welcome to Misun Academy API
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 documentation:
 *                   type: string
 *                   example: /api-docs
 *                 health:
 *                   type: string
 *                   example: /health
 *                 endpoints:
 *                   type: object
 */
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Misun Academy API",
    version: "1.0.0",
    documentation: "/api-docs",
    health: "/health",
    endpoints: {
      auth: "/api/auth",
      courses: "/api/courses",
      quizzes: "/api/quizzes",
      assignments: "/api/student/assignments",
      enrollments: "/api/admin/enrollments",
      users: "/api/admin/users",
      chat: "/api/chat",
    },
  });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health Check
 *     description: Returns detailed system health status including database and cache connections
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 12345
 *                 services:
 *                   type: object
 *                 memory:
 *                   type: object
 */
app.get("/health", (_req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  const healthStatus = {
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    services: {
      database: {
        status:
          mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        type: "MongoDB",
      },
      cache: {
        status: redisClient ? "configured" : "not configured",
        type: "Redis",
      },
    },
    memory: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
    },
    environment: process.env.NODE_ENV || "development",
  };

  res.status(200).json(healthStatus);
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
