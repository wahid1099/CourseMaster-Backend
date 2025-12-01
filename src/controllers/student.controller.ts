import { Response, NextFunction } from 'express';
import Course from '../models/Course.model';
import Enrollment from '../models/Enrollment.model';
import Progress from '../models/Progress.model';
import Assignment from '../models/Assignment.model';
import { Quiz, QuizAttempt } from '../models/Quiz.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import emailService from '../utils/email.util';

// @desc    Get student dashboard
// @route   GET /api/student/dashboard
// @access  Private/Student
export const getDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const enrollments = await Enrollment.find({ student: req.user!._id })
      .populate('course', 'title thumbnail instructor category')
      .sort('-enrolledAt');

    res.status(200).json({
      success: true,
      enrollments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Enroll in course
// @route   POST /api/student/enroll/:courseId
// @access  Private/Student
export const enrollCourse = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: req.user!._id,
      course: course._id
    });

    if (existingEnrollment) {
      throw new AppError('Already enrolled in this course', 400);
    }

    // Calculate total lessons
    const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);

    // Create enrollment
    const enrollment = await Enrollment.create({
      student: req.user!._id,
      course: course._id,
      totalLessons
    });

    // Send enrollment email (non-blocking)
    emailService.sendEnrollmentEmail(req.user!.name, req.user!.email, course.title).catch(err =>
      console.error('Enrollment email failed:', err)
    );

    res.status(201).json({
      success: true,
      enrollment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get course content (for enrolled students)
// @route   GET /api/student/courses/:courseId
// @access  Private/Student
export const getCourseContent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check enrollment
    const enrollment = await Enrollment.findOne({
      student: req.user!._id,
      course: req.params.courseId
    });

    if (!enrollment) {
      throw new AppError('Not enrolled in this course', 403);
    }

    const course = await Course.findById(req.params.courseId);
    const progress = await Progress.find({
      student: req.user!._id,
      course: req.params.courseId
    });

    res.status(200).json({
      success: true,
      course,
      progress,
      enrollment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark lesson as complete
// @route   POST /api/student/progress
// @access  Private/Student
export const markLessonComplete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId, moduleIndex, lessonIndex } = req.body;

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      student: req.user!._id,
      course: courseId
    });

    if (!enrollment) {
      throw new AppError('Not enrolled in this course', 403);
    }

    // Create or update progress
    await Progress.findOneAndUpdate(
      {
        student: req.user!._id,
        course: courseId,
        moduleIndex,
        lessonIndex
      },
      {
        student: req.user!._id,
        course: courseId,
        moduleIndex,
        lessonIndex
      },
      { upsert: true, new: true }
    );

    // Update enrollment progress
    const completedLessons = await Progress.countDocuments({
      student: req.user!._id,
      course: courseId
    });

    const progress = Math.round((completedLessons / enrollment.totalLessons) * 100);
    const isCompleted = progress === 100;

    await Enrollment.findByIdAndUpdate(enrollment._id, {
      completedLessons,
      progress,
      isCompleted,
      ...(isCompleted && { completedAt: new Date() })
    });

    res.status(200).json({
      success: true,
      message: 'Lesson marked as complete',
      progress
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit assignment
// @route   POST /api/student/assignments
// @access  Private/Student
export const submitAssignment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId, moduleIndex, title, description, answer } = req.body;

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      student: req.user!._id,
      course: courseId
    });

    if (!enrollment) {
      throw new AppError('Not enrolled in this course', 403);
    }

    const assignment = await Assignment.create({
      student: req.user!._id,
      course: courseId,
      moduleIndex,
      title,
      description,
      submission: {
        answer,
        submittedAt: new Date()
      },
      status: 'submitted'
    });

    res.status(201).json({
      success: true,
      assignment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Take quiz
// @route   POST /api/student/quizzes/:quizId/attempt
// @access  Private/Student
export const takeQuiz = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { answers } = req.body;
    const quiz = await Quiz.findById(req.params.quizId);

    if (!quiz) {
      throw new AppError('Quiz not found', 404);
    }

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      student: req.user!._id,
      course: quiz.course
    });

    if (!enrollment) {
      throw new AppError('Not enrolled in this course', 403);
    }

    // Calculate score
    let correctAnswers = 0;
    quiz.questions.forEach((question, index) => {
      if (question.correctAnswer === answers[index]) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;

    const attempt = await QuizAttempt.create({
      student: req.user!._id,
      quiz: quiz._id,
      answers,
      score,
      passed
    });

    res.status(201).json({
      success: true,
      score,
      passed,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      attempt
    });
  } catch (error) {
    next(error);
  }
};
