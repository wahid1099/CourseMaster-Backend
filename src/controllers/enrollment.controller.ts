import { Request, Response, NextFunction } from "express";
import Enrollment from "../models/Enrollment.model";
import { AppError } from "../middleware/error.middleware";

// Get all enrollments with filters
export const getAllEnrollments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { course, student, status, page = 1, limit = 20, search } = req.query;

    const query: any = {};

    if (course) query.course = course;
    if (student) query.student = student;
    if (status) query.isCompleted = status === "completed";

    const skip = (Number(page) - 1) * Number(limit);

    let enrollments = await Enrollment.find(query)
      .populate("student", "name email")
      .populate("course", "title category batch")
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Search filter (if provided)
    if (search) {
      enrollments = enrollments.filter(
        (enrollment: any) =>
          enrollment.student?.name
            ?.toLowerCase()
            .includes((search as string).toLowerCase()) ||
          enrollment.student?.email
            ?.toLowerCase()
            .includes((search as string).toLowerCase())
      );
    }

    const total = await Enrollment.countDocuments(query);

    res.status(200).json({
      success: true,
      enrollments,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
    });
  } catch (error) {
    next(error);
  }
};

// Get enrollments for a specific course
export const getEnrollmentsByCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const enrollments = await Enrollment.find({ course: id })
      .populate("student", "name email avatar")
      .sort({ enrolledAt: -1 });

    res.status(200).json({
      success: true,
      enrollments,
      total: enrollments.length,
    });
  } catch (error) {
    next(error);
  }
};

// Get enrollments for a specific batch
export const getEnrollmentsByBatch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name } = req.params;

    // First, find courses with this batch name
    const Course = require("../models/Course.model").default;
    const courses = await Course.find({ "batch.name": name }).select("_id");
    const courseIds = courses.map((c: any) => c._id);

    const enrollments = await Enrollment.find({ course: { $in: courseIds } })
      .populate("student", "name email avatar")
      .populate("course", "title batch")
      .sort({ enrolledAt: -1 });

    res.status(200).json({
      success: true,
      batch: name,
      enrollments,
      total: enrollments.length,
    });
  } catch (error) {
    next(error);
  }
};

// Get enrollment statistics
export const getEnrollmentStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const totalEnrollments = await Enrollment.countDocuments();
    const activeEnrollments = await Enrollment.countDocuments({
      isCompleted: false,
    });
    const completedEnrollments = await Enrollment.countDocuments({
      isCompleted: true,
    });

    // Enrollments by course
    const byCourse = await Enrollment.aggregate([
      {
        $group: {
          _id: "$course",
          count: { $sum: 1 },
          avgProgress: { $avg: "$progress" },
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
          count: 1,
          avgProgress: { $round: ["$avgProgress", 2] },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total: totalEnrollments,
        active: activeEnrollments,
        completed: completedEnrollments,
        byCourse,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get single enrollment details
export const getEnrollmentById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const enrollment = await Enrollment.findById(id)
      .populate("student", "name email avatar")
      .populate("course");

    if (!enrollment) {
      return next(new AppError("Enrollment not found", 404));
    }

    res.status(200).json({
      success: true,
      enrollment,
    });
  } catch (error) {
    next(error);
  }
};

// Enroll student in a course
export const enrollInCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params; // course ID
    const studentId = (req as any).user._id;

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: id,
    });

    if (existingEnrollment) {
      return next(new AppError("You are already enrolled in this course", 400));
    }

    // Get course to calculate total lessons
    const Course = require("../models/Course.model").default;
    const course = await Course.findById(id);

    if (!course) {
      return next(new AppError("Course not found", 404));
    }

    // Calculate total lessons
    let totalLessons = 0;
    if (course.modules && Array.isArray(course.modules)) {
      totalLessons = course.modules.reduce((sum: number, module: any) => {
        return sum + (module.lessons ? module.lessons.length : 0);
      }, 0);
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      student: studentId,
      course: id,
      totalLessons,
      progress: 0,
      completedLessons: 0,
      isCompleted: false,
    });

    res.status(201).json({
      success: true,
      message: "Successfully enrolled in course",
      enrollment,
    });
  } catch (error) {
    next(error);
  }
};
