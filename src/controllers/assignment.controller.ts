import { Request, Response, NextFunction } from 'express';
import Assignment from '../models/Assignment.model';
import { AppError } from '../middleware/error.middleware';

// Get all assignments with filters
export const getAllAssignments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { course, student, status, page = 1, limit = 20, search } = req.query;

    const query: any = {};
    
    if (course) query.course = course;
    if (student) query.student = student;
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    let assignments = await Assignment.find(query)
      .populate('student', 'name email avatar')
      .populate('course', 'title category')
      .populate('review.reviewedBy', 'name')
      .sort({ 'submission.submittedAt': -1 })
      .skip(skip)
      .limit(Number(limit));

    // Search filter
    if (search) {
      assignments = assignments.filter((assignment: any) =>
        assignment.student?.name?.toLowerCase().includes((search as string).toLowerCase()) ||
        assignment.student?.email?.toLowerCase().includes((search as string).toLowerCase()) ||
        assignment.title?.toLowerCase().includes((search as string).toLowerCase())
      );
    }

    const total = await Assignment.countDocuments(query);

    res.status(200).json({
      success: true,
      assignments,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    });
  } catch (error) {
    next(error);
  }
};

// Get assignments for a specific course
export const getAssignmentsByCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const assignments = await Assignment.find({ course: id })
      .populate('student', 'name email avatar')
      .populate('review.reviewedBy', 'name')
      .sort({ 'submission.submittedAt': -1 });

    res.status(200).json({
      success: true,
      assignments,
      total: assignments.length
    });
  } catch (error) {
    next(error);
  }
};

// Get pending assignments
export const getPendingAssignments = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const assignments = await Assignment.find({ status: { $in: ['pending', 'submitted'] } })
      .populate('student', 'name email avatar')
      .populate('course', 'title category')
      .sort({ 'submission.submittedAt': -1 });

    res.status(200).json({
      success: true,
      assignments,
      total: assignments.length
    });
  } catch (error) {
    next(error);
  }
};

// Get single assignment details
export const getAssignmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id)
      .populate('student', 'name email avatar')
      .populate('course', 'title category instructor')
      .populate('review.reviewedBy', 'name email');

    if (!assignment) {
      return next(new AppError('Assignment not found', 404));
    }

    res.status(200).json({
      success: true,
      assignment
    });
  } catch (error) {
    next(error);
  }
};

// Review/grade an assignment
export const reviewAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    const reviewerId = (req as any).user._id;

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return next(new AppError('Assignment not found', 404));
    }

    assignment.review = {
      feedback,
      reviewedBy: reviewerId,
      reviewedAt: new Date()
    };
    assignment.status = 'reviewed';

    await assignment.save();

    const updatedAssignment = await Assignment.findById(id)
      .populate('student', 'name email')
      .populate('course', 'title')
      .populate('review.reviewedBy', 'name');

    res.status(200).json({
      success: true,
      message: 'Assignment reviewed successfully',
      assignment: updatedAssignment
    });
  } catch (error) {
    next(error);
  }
};

// Get assignment statistics
export const getAssignmentStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const total = await Assignment.countDocuments();
    const pending = await Assignment.countDocuments({ status: { $in: ['pending', 'submitted'] } });
    const reviewed = await Assignment.countDocuments({ status: 'reviewed' });

    // Assignments by course
    const byCourse = await Assignment.aggregate([
      {
        $group: {
          _id: '$course',
          total: { $sum: 1 },
          pending: {
            $sum: {
              $cond: [{ $in: ['$status', ['pending', 'submitted']] }, 1, 0]
            }
          },
          reviewed: {
            $sum: {
              $cond: [{ $eq: ['$status', 'reviewed'] }, 1, 0]
            }
          }
        }
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
          courseId: '$_id',
          courseName: '$courseInfo.title',
          total: 1,
          pending: 1,
          reviewed: 1
        }
      },
      {
        $sort: { total: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total,
        pending,
        reviewed,
        byCourse
      }
    });
  } catch (error) {
    next(error);
  }
};
