import { Request, Response, NextFunction } from "express";
import { Quiz } from "../models/Quiz.model";
import Course from "../models/Course.model";
import { AppError } from "../middleware/error.middleware";

// Create quiz for a course
export const createQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseId, moduleIndex, title, questions, passingScore } = req.body;

    // Verify course exists only if courseId is provided
    if (courseId) {
      // Validate ObjectId format
      if (!courseId.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new AppError("Invalid course ID format", 400));
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return next(new AppError("Course not found", 404));
      }
    }

    const quiz = await Quiz.create({
      course: courseId || undefined,
      moduleIndex: moduleIndex !== undefined ? moduleIndex : undefined,
      title,
      questions,
      passingScore: passingScore || 70,
    });

    res.status(201).json({
      success: true,
      message: "Quiz created successfully",
      quiz,
    });
  } catch (error) {
    next(error);
  }
};

// Update quiz
export const updateQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, questions, passingScore } = req.body;

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return next(new AppError("Quiz not found", 404));
    }

    // Update fields
    if (title) quiz.title = title;
    if (questions) {
      quiz.questions = questions;
    }
    if (passingScore !== undefined) quiz.passingScore = passingScore;

    await quiz.save();

    res.status(200).json({
      success: true,
      message: "Quiz updated successfully",
      quiz,
    });
  } catch (error) {
    next(error);
  }
};

// Delete quiz
export const deleteQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findByIdAndDelete(id);
    if (!quiz) {
      return next(new AppError("Quiz not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get all quizzes for admin (with correct answers)
export const getAllQuizzesAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseId } = req.query;

    const query: any = {};
    if (courseId) query.course = courseId;

    const quizzes = await Quiz.find(query)
      .populate("course", "title")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      quizzes,
    });
  } catch (error) {
    next(error);
  }
};

// Get quiz by ID for admin (with correct answers)
export const getQuizByIdAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findById(id).populate("course", "title");

    if (!quiz) {
      return next(new AppError("Quiz not found", 404));
    }

    res.status(200).json({
      success: true,
      quiz,
    });
  } catch (error) {
    next(error);
  }
};
