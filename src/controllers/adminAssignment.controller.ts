import { Request, Response, NextFunction } from 'express';
import Assignment from '../models/Assignment.model';
import User from '../models/User.model';
import Course from '../models/Course.model';
import { AppError } from '../middleware/error.middleware';

// Create assignment (for batch or individual)
export const createAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId, batch, moduleIndex, title, description, dueDate } = req.body;
    const createdBy = (req as any).user._id;

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return next(new AppError('Course not found', 404));
    }

    // If batch is specified, create assignment template for the batch
    if (batch) {
      // Verify batch exists in course
      if (course.batch.name !== batch) {
        return next(new AppError('Batch not found in this course', 404));
      }

      // Get all students enrolled in this batch
      const students = await User.find({ role: 'student', 'batch': batch });

      // Create assignment for each student
      const assignments = await Promise.all(
        students.map(student =>
          Assignment.create({
            student: student._id,
            course: courseId,
            batch,
            moduleIndex,
            title,
            description,
            dueDate,
            createdBy,
            status: 'pending'
          })
        )
      );

      res.status(201).json({
        success: true,
        message: `Assignment created for ${assignments.length} students in batch ${batch}`,
        count: assignments.length
      });
    } else {
      // Create assignment template (not assigned to specific students yet)
      const assignment = await Assignment.create({
        course: courseId,
        moduleIndex,
        title,
        description,
        dueDate,
        createdBy,
        status: 'pending'
      });

      res.status(201).json({
        success: true,
        message: 'Assignment created successfully',
        assignment
      });
    }
  } catch (error) {
    next(error);
  }
};

// Get all assignments (admin view)
export const getAllAssignments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId, batch, status } = req.query;

    const query: any = {};
    if (courseId) query.course = courseId;
    if (batch) query.batch = batch;
    if (status) query.status = status;

    const assignments = await Assignment.find(query)
      .populate('student', 'name email')
      .populate('course', 'title')
      .populate('createdBy', 'name')
      .populate('review.reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: assignments.length,
      assignments
    });
  } catch (error) {
    next(error);
  }
};

// Get assignment by ID
export const getAssignmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id)
      .populate('student', 'name email')
      .populate('course', 'title')
      .populate('createdBy', 'name')
      .populate('review.reviewedBy', 'name');

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

// Update assignment
export const updateAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, dueDate } = req.body;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return next(new AppError('Assignment not found', 404));
    }

    // Update fields
    if (title) assignment.title = title;
    if (description) assignment.description = description;
    if (dueDate) assignment.dueDate = new Date(dueDate);

    await assignment.save();

    res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      assignment
    });
  } catch (error) {
    next(error);
  }
};

// Delete assignment
export const deleteAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findByIdAndDelete(id);
    if (!assignment) {
      return next(new AppError('Assignment not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Review assignment
export const reviewAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    const reviewedBy = (req as any).user._id;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return next(new AppError('Assignment not found', 404));
    }

    if (assignment.status !== 'submitted') {
      return next(new AppError('Assignment has not been submitted yet', 400));
    }

    assignment.review = {
      feedback,
      reviewedBy,
      reviewedAt: new Date()
    };
    assignment.status = 'reviewed';

    await assignment.save();

    res.status(200).json({
      success: true,
      message: 'Assignment reviewed successfully',
      assignment
    });
  } catch (error) {
    next(error);
  }
};

// Get assignment statistics
export const getAssignmentStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.query;

    const query: any = {};
    if (courseId) query.course = courseId;

    const [total, pending, submitted, reviewed] = await Promise.all([
      Assignment.countDocuments(query),
      Assignment.countDocuments({ ...query, status: 'pending' }),
      Assignment.countDocuments({ ...query, status: 'submitted' }),
      Assignment.countDocuments({ ...query, status: 'reviewed' })
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total,
        pending,
        submitted,
        reviewed
      }
    });
  } catch (error) {
    next(error);
  }
};
