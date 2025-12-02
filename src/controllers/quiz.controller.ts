import { Request, Response, NextFunction } from 'express';
import { Quiz } from '../models/Quiz.model';
import QuizResult from '../models/QuizResult.model';
import { AppError } from '../middleware/error.middleware';

// Get all quizzes for a course
export const getQuizzesByCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;

    const quizzes = await Quiz.find({ course: courseId })
      .select('-questions.correctAnswer') // Don't send correct answers
      .sort({ moduleIndex: 1 });

    res.status(200).json({
      success: true,
      quizzes
    });
  } catch (error) {
    next(error);
  }
};

// Get quiz by ID (for taking quiz)
export const getQuizById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findById(id)
      .select('-questions.correctAnswer'); // Don't send correct answers

    if (!quiz) {
      return next(new AppError('Quiz not found', 404));
    }

    res.status(200).json({
      success: true,
      quiz
    });
  } catch (error) {
    next(error);
  }
};

// Submit quiz
export const submitQuiz = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { answers, timeSpent } = req.body; // answers is array of selected option indices
    const studentId = (req as any).user._id;

    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return next(new AppError('Quiz not found', 404));
    }

    // Calculate score
    let score = 0;
    const totalPoints = quiz.questions.reduce((sum: number, q: any) => sum + (q.points || 1), 0);
    
    const results = quiz.questions.map((question: any, index: number) => {
      const isCorrect = answers[index] === question.correctAnswer;
      const questionPoints = question.points || 1;
      if (isCorrect) {
        score += questionPoints;
      }
      return {
        questionIndex: index,
        selectedAnswer: answers[index],
        correctAnswer: question.correctAnswer,
        isCorrect,
        points: isCorrect ? questionPoints : 0
      };
    });

    const percentage = Math.round((score / totalPoints) * 100);
    const passed = percentage >= (quiz.passingScore || 70);

    // Save quiz result
    const quizResult = await QuizResult.create({
      student: studentId,
      quiz: id,
      course: quiz.course,
      answers,
      score,
      totalPoints,
      percentage,
      passed,
      timeSpent: timeSpent || 0
    });

    res.status(200).json({
      success: true,
      message: 'Quiz submitted successfully',
      result: {
        score,
        totalPoints,
        percentage,
        passed,
        results,
        quizResultId: quizResult._id
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get quiz history for student
export const getQuizHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = (req as any).user._id;
    const { courseId } = req.query;

    const query: any = { student: studentId };
    if (courseId) query.course = courseId;

    const history = await QuizResult.find(query)
      .populate('quiz', 'title moduleIndex')
      .populate('course', 'title')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    next(error);
  }
};

// Get specific quiz result details
export const getQuizResult = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const studentId = (req as any).user._id;

    const result = await QuizResult.findOne({ _id: id, student: studentId })
      .populate('quiz')
      .populate('course', 'title');

    if (!result) {
      return next(new AppError('Quiz result not found', 404));
    }

    res.status(200).json({
      success: true,
      result
    });
  } catch (error) {
    next(error);
  }
};
