import { Request, Response, NextFunction } from 'express';
import Course from '../models/Course.model';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import redisClient from '../utils/redis.util';

// @desc    Get all courses with pagination, search, filter, sort
// @route   GET /api/courses
// @access  Public
export const getCourses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { isPublished: true };

    // Search
    if (req.query.search) {
      query.$text = { $search: req.query.search as string };
    }

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by tags
    if (req.query.tags) {
      query.tags = { $in: (req.query.tags as string).split(',') };
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice as string);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice as string);
    }

    // Build sort
    let sort: any = { createdAt: -1 };
    if (req.query.sort) {
      const sortField = req.query.sort as string;
      if (sortField === 'price-asc') sort = { price: 1 };
      else if (sortField === 'price-desc') sort = { price: -1 };
      else if (sortField === 'title') sort = { title: 1 };
    }

    // Try to get from cache
    const cacheKey = `courses:${JSON.stringify({ query, sort, page, limit })}`;
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      res.status(200).json(JSON.parse(cachedData));
      return;
    }

    // Execute query
    const courses = await Course.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-modules'); // Exclude modules for list view

    const total = await Course.countDocuments(query);

    const response = {
      success: true,
      count: courses.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      courses
    };

    // Cache for 1 hour
    await redisClient.set(cacheKey, JSON.stringify(response), 3600);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
export const getCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    res.status(200).json({
      success: true,
      course
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create course
// @route   POST /api/courses
// @access  Private/Admin
export const createCourse = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const course = await Course.create(req.body);

    // Clear cache
    await redisClient.delPattern('courses:*');

    res.status(201).json({
      success: true,
      course
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Admin
export const updateCourse = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    // Clear cache
    await redisClient.delPattern('courses:*');

    res.status(200).json({
      success: true,
      course
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
export const deleteCourse = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    // Clear cache
    await redisClient.delPattern('courses:*');

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get course categories
// @route   GET /api/courses/categories
// @access  Public
export const getCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await Course.distinct('category', { isPublished: true });

    res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    next(error);
  }
};
