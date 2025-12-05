import jwt from "jsonwebtoken";
import User, { IUser } from "../../models/User.model";
import Course, { ICourse } from "../../models/Course.model";
import { Quiz, IQuiz } from "../../models/Quiz.model";
import mongoose from "mongoose";

/**
 * Generate JWT token for testing
 */
export const generateTestToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

/**
 * Create a test user
 */
export const createTestUser = async (
  overrides: Partial<IUser> = {}
): Promise<IUser> => {
  const defaultUser = {
    name: "Test User",
    email: `test${Date.now()}@example.com`,
    password: "password123",
    role: "student" as const,
  };

  const user = await User.create({ ...defaultUser, ...overrides });
  return user;
};

/**
 * Create a test admin user
 */
export const createTestAdmin = async (): Promise<IUser> => {
  return createTestUser({
    name: "Test Admin",
    email: `admin${Date.now()}@example.com`,
    role: "admin",
  });
};

/**
 * Create a test instructor user
 */
export const createTestInstructor = async (): Promise<IUser> => {
  return createTestUser({
    name: "Test Instructor",
    email: `instructor${Date.now()}@example.com`,
    role: "instructor",
  });
};

/**
 * Create a test course
 */
export const createTestCourse = async (
  overrides: Partial<ICourse> = {}
): Promise<ICourse> => {
  const defaultCourse = {
    title: "Test Course",
    description: "This is a test course description for testing purposes",
    instructor: "Test Instructor",
    price: 99.99,
    category: "Programming",
    tags: ["test", "javascript"],
    thumbnail: "https://example.com/thumbnail.jpg",
    modules: [
      {
        title: "Module 1",
        description: "First module",
        order: 1,
        lessons: [
          {
            title: "Lesson 1",
            videoUrl: "https://example.com/video1.mp4",
            duration: 30,
            order: 1,
          },
        ],
      },
    ],
    batch: {
      name: "Batch 2024",
      startDate: new Date("2024-01-01"),
    },
    isPublished: true,
  };

  const course = await Course.create({ ...defaultCourse, ...overrides });
  return course;
};

/**
 * Create a test quiz
 */
export const createTestQuiz = async (
  courseId?: mongoose.Types.ObjectId,
  overrides: Partial<IQuiz> = {}
): Promise<IQuiz> => {
  const defaultQuiz = {
    course: courseId,
    moduleIndex: 0,
    title: "Test Quiz",
    questions: [
      {
        question: "What is 2 + 2?",
        options: ["3", "4", "5", "6"],
        correctAnswer: 1,
      },
      {
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correctAnswer: 2,
      },
    ],
    passingScore: 70,
  };

  const quiz = await Quiz.create({ ...defaultQuiz, ...overrides });
  return quiz;
};

/**
 * Mock email service to prevent actual emails during tests
 */
export const mockEmailService = {
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendEnrollmentConfirmation: jest.fn().mockResolvedValue(true),
};

/**
 * Create authenticated request mock
 */
export const createAuthRequest = (user: IUser) => {
  return {
    user: {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    headers: {
      authorization: `Bearer ${generateTestToken(user._id.toString())}`,
    },
  };
};
