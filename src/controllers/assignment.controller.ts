import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Assignment from "../models/Assignment.model";
import { AppError } from "../middleware/error.middleware";
import redisClient from "../utils/redis.util";

// Get all assignments with filters
export const getAllAssignments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { course, student, status, page = 1, limit = 20, search } = req.query;
    const user = (req as any).user;

    // Build cache key based on user and filters
    const cacheKey = `assignments:all:${user._id}:${JSON.stringify({
      course,
      student,
      status,
      page,
      limit,
      search,
    })}`;
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      res.status(200).json(JSON.parse(cachedData));
      return;
    }

    const query: any = {};

    // If user is a student, show their assignments and general course assignments
    if (user.role === "student") {
      // Get student's enrolled courses
      const Enrollment = mongoose.model("Enrollment");
      const enrollments = await Enrollment.find({ student: user._id }).select(
        "course"
      );
      const enrolledCourseIds = enrollments.map((e: any) => e.course);

      // Show assignments that are either:
      // 1. Specifically assigned to this student
      // 2. General assignments for courses they're enrolled in (no specific student)
      query.$or = [
        { student: user._id },
        { course: { $in: enrolledCourseIds }, student: { $exists: false } },
      ];
    } else {
      // Admins, teachers, and moderators can filter by student
      if (course) query.course = course;
      if (student) query.student = student;
    }

    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    let assignments = await Assignment.find(query)
      .populate("student", "name email avatar")
      .populate("course", "title category")
      .populate("review.reviewedBy", "name")
      .sort({ "submission.submittedAt": -1 })
      .skip(skip)
      .limit(Number(limit));

    // Search filter
    if (search) {
      assignments = assignments.filter(
        (assignment: any) =>
          assignment.student?.name
            ?.toLowerCase()
            .includes((search as string).toLowerCase()) ||
          assignment.student?.email
            ?.toLowerCase()
            .includes((search as string).toLowerCase()) ||
          assignment.title
            ?.toLowerCase()
            .includes((search as string).toLowerCase())
      );
    }

    const total = await Assignment.countDocuments(query);

    const response = {
      success: true,
      assignments,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
    };

    // Cache for 15 minutes
    await redisClient.set(cacheKey, JSON.stringify(response), 900);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get assignments for a specific course
export const getAssignmentsByCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Build cache key based on course and user
    const cacheKey = `assignments:course:${id}:${user._id}`;
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      res.status(200).json(JSON.parse(cachedData));
      return;
    }

    const query: any = { course: id };

    // Students can only see their own assignments
    if (user.role === "student") {
      query.student = user._id;
    }

    const assignments = await Assignment.find(query)
      .populate("student", "name email avatar")
      .populate("review.reviewedBy", "name")
      .sort({ "submission.submittedAt": -1 });

    const response = {
      success: true,
      assignments,
      total: assignments.length,
    };

    // Cache for 15 minutes
    await redisClient.set(cacheKey, JSON.stringify(response), 900);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get pending assignments
export const getPendingAssignments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = (req as any).user;

    // Only admins, teachers, and moderators can see pending assignments
    if (user.role === "student") {
      return next(new AppError("Not authorized to access this resource", 403));
    }

    // Cache key for pending assignments
    const cacheKey = `assignments:pending`;
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      res.status(200).json(JSON.parse(cachedData));
      return;
    }

    const assignments = await Assignment.find({
      status: { $in: ["pending", "submitted"] },
    })
      .populate("student", "name email avatar")
      .populate("course", "title category")
      .sort({ "submission.submittedAt": -1 });

    const response = {
      success: true,
      assignments,
      total: assignments.length,
    };

    // Cache for 5 minutes (more dynamic data)
    await redisClient.set(cacheKey, JSON.stringify(response), 300);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get single assignment details
export const getAssignmentById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const assignment = await Assignment.findById(id)
      .populate("student", "name email avatar")
      .populate("course", "title category instructor")
      .populate("review.reviewedBy", "name email");

    if (!assignment) {
      return next(new AppError("Assignment not found", 404));
    }

    // Students can only view their own assignments
    if (
      user.role === "student" &&
      assignment.student &&
      (assignment.student as any)._id.toString() !== user._id.toString()
    ) {
      return next(
        new AppError("Not authorized to access this assignment", 403)
      );
    }

    res.status(200).json({
      success: true,
      assignment,
    });
  } catch (error) {
    next(error);
  }
};

// Review/grade an assignment
export const reviewAssignment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    const user = (req as any).user;
    const reviewerId = user._id;

    // Only admins, teachers, and moderators can review assignments
    if (user.role === "student") {
      return next(new AppError("Not authorized to review assignments", 403));
    }

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return next(new AppError("Assignment not found", 404));
    }

    assignment.review = {
      feedback,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    };
    assignment.status = "reviewed";

    await assignment.save();

    // Clear assignment caches
    await redisClient.delPattern("assignments:*");

    const updatedAssignment = await Assignment.findById(id)
      .populate("student", "name email")
      .populate("course", "title")
      .populate("review.reviewedBy", "name");

    res.status(200).json({
      success: true,
      message: "Assignment reviewed successfully",
      assignment: updatedAssignment,
    });
  } catch (error) {
    next(error);
  }
};

// Get assignment statistics
export const getAssignmentStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = (req as any).user;

    // Only admins, teachers, and moderators can see assignment stats
    if (user.role === "student") {
      return next(
        new AppError("Not authorized to access assignment statistics", 403)
      );
    }

    const total = await Assignment.countDocuments();
    const pending = await Assignment.countDocuments({
      status: { $in: ["pending", "submitted"] },
    });
    const reviewed = await Assignment.countDocuments({ status: "reviewed" });

    // Assignments by course
    const byCourse = await Assignment.aggregate([
      {
        $group: {
          _id: "$course",
          total: { $sum: 1 },
          pending: {
            $sum: {
              $cond: [{ $in: ["$status", ["pending", "submitted"]] }, 1, 0],
            },
          },
          reviewed: {
            $sum: {
              $cond: [{ $eq: ["$status", "reviewed"] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "_id",
          as: "courseInfo",
        },
      },
      {
        $unwind: "$courseInfo",
      },
      {
        $project: {
          courseId: "$_id",
          courseName: "$courseInfo.title",
          total: 1,
          pending: 1,
          reviewed: 1,
        },
      },
      {
        $sort: { total: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total,
        pending,
        reviewed,
        byCourse,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Submit assignment (for students)
export const submitAssignment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseId, title, description, answer } = req.body;
    const user = (req as any).user;

    // Only students can submit assignments
    if (user.role !== "student") {
      return next(new AppError("Only students can submit assignments", 403));
    }

    // Find or create assignment
    let assignment = await Assignment.findOne({
      course: courseId,
      title: title,
      $or: [{ student: user._id }, { student: { $exists: false } }],
    });

    if (!assignment) {
      // Create new assignment submission
      assignment = await Assignment.create({
        student: user._id,
        course: courseId,
        title,
        description,
        submission: {
          answer,
          submittedAt: new Date(),
        },
        status: "submitted",
        createdBy: user._id,
      });
    } else {
      // Update existing assignment with submission
      assignment.student = user._id;
      assignment.submission = {
        answer,
        submittedAt: new Date(),
      };
      assignment.status = "submitted";
      await assignment.save();
    }

    // Clear assignment caches
    await redisClient.delPattern("assignments:*");

    res.status(200).json({
      success: true,
      message: "Assignment submitted successfully",
      assignment,
    });
  } catch (error) {
    next(error);
  }
};
