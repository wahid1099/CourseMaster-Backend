import { Response, NextFunction } from 'express';
import Course from '../models/Course.model';
import Enrollment from '../models/Enrollment.model';
import Assignment from '../models/Assignment.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

// @desc    Get all enrollments for a course
// @route   GET /api/admin/courses/:courseId/enrollments
// @access  Private/Admin
export const getCourseEnrollments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const enrollments = await Enrollment.find({ course: req.params.courseId })
      .populate('student', 'name email')
      .sort('-enrolledAt');

    res.status(200).json({
      success: true,
      count: enrollments.length,
      enrollments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all assignments for review
// @route   GET /api/admin/assignments
// @access  Private/Admin
export const getAssignments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query: any = {};
    
    if (req.query.courseId) {
      query.course = req.query.courseId;
    }
    
    if (req.query.status) {
      query.status = req.query.status;
    }

    const assignments = await Assignment.find(query)
      .populate('student', 'name email')
      .populate('course', 'title')
      .sort('-submission.submittedAt');

    res.status(200).json({
      success: true,
      count: assignments.length,
      assignments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Review assignment
// @route   PUT /api/admin/assignments/:id/review
// @access  Private/Admin
export const reviewAssignment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { feedback } = req.body;

    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      {
        review: {
          feedback,
          reviewedBy: req.user!._id,
          reviewedAt: new Date()
        },
        status: 'reviewed'
      },
      { new: true }
    );

    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }

    res.status(200).json({
      success: true,
      assignment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get analytics data
// @route   GET /api/admin/analytics
// @access  Private/Admin
export const getAnalytics = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const totalCourses = await Course.countDocuments({ isPublished: true });
    const totalEnrollments = await Enrollment.countDocuments();
    const completedCourses = await Enrollment.countDocuments({ isCompleted: true });

    // Enrollments over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const enrollmentTrends = await Enrollment.aggregate([
      {
        $match: {
          enrolledAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$enrolledAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Popular courses
    const popularCourses = await Enrollment.aggregate([
      {
        $group: {
          _id: '$course',
          enrollments: { $sum: 1 }
        }
      },
      {
        $sort: { enrollments: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'courseInfo'
        }
      },
      {
        $unwind: '$courseInfo'
      },
      {
        $project: {
          title: '$courseInfo.title',
          enrollments: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        totalCourses,
        totalEnrollments,
        completedCourses,
        completionRate: totalEnrollments > 0 ? Math.round((completedCourses / totalEnrollments) * 100) : 0,
        enrollmentTrends,
        popularCourses
      }
    });
  } catch (error) {
    next(error);
  }
};
