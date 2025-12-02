import { Request, Response, NextFunction } from 'express';
import Enrollment from '../models/Enrollment.model';
import Course from '../models/Course.model';
import { AppError } from '../middleware/error.middleware';

// Get student's enrolled courses
export const getStudentDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = (req as any).user._id;

    const enrollments = await Enrollment.find({ student: studentId })
      .populate('course', 'title thumbnail instructor category batch')
      .sort({ enrolledAt: -1 });

    res.status(200).json({
      success: true,
      enrollments
    });
  } catch (error) {
    next(error);
  }
};

// Get specific course for learning
export const getCourseForLearning = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const studentId = (req as any).user._id;

    // Check if student is enrolled
    const enrollment = await Enrollment.findOne({ student: studentId, course: id });
    
    if (!enrollment) {
      return next(new AppError('You are not enrolled in this course', 403));
    }

    // Get full course details
    const course = await Course.findById(id);
    
    if (!course) {
      return next(new AppError('Course not found', 404));
    }

    res.status(200).json({
      success: true,
      course,
      enrollment
    });
  } catch (error) {
    next(error);
  }
};

// Mark lesson as complete
export const markLessonComplete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params; // enrollment id
    const studentId = (req as any).user._id;

    const enrollment = await Enrollment.findOne({ _id: id, student: studentId })
      .populate('course');

    if (!enrollment) {
      return next(new AppError('Enrollment not found', 404));
    }

    // Check if totalLessons is 0 to prevent division by zero
    if (enrollment.totalLessons === 0) {
      return next(new AppError('Course has no lessons', 400));
    }

    // Check if already completed all lessons
    if (enrollment.completedLessons >= enrollment.totalLessons) {
      res.status(200).json({
        success: true,
        message: 'All lessons already completed',
        enrollment
      });
      return;
    }

    // Increment completed lessons count
    enrollment.completedLessons = enrollment.completedLessons + 1;

    // Calculate progress - safely handle division
    const totalLessons = enrollment.totalLessons;
    enrollment.progress = totalLessons > 0 
      ? Math.round((enrollment.completedLessons / totalLessons) * 100)
      : 0;

    // Check if course is completed
    if (enrollment.completedLessons >= totalLessons) {
      enrollment.isCompleted = true;
      enrollment.completedAt = new Date();
    }

    await enrollment.save();

    res.status(200).json({
      success: true,
      message: 'Lesson marked as complete',
      enrollment
    });
  } catch (error) {
    next(error);
  }
};

// Get enrollment progress details
export const getEnrollmentProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const studentId = (req as any).user._id;

    const enrollment = await Enrollment.findOne({ _id: id, student: studentId })
      .populate('course');

    if (!enrollment) {
      return next(new AppError('Enrollment not found', 404));
    }

    res.status(200).json({
      success: true,
      progress: {
        completedLessons: enrollment.completedLessons,
        totalLessons: enrollment.totalLessons,
        percentage: enrollment.progress,
        isCompleted: enrollment.isCompleted
      }
    });
  } catch (error) {
    next(error);
  }
};
