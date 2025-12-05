import { Response, NextFunction } from "express";
import User from "../models/User.model";
import { AuthRequest } from "../middleware/auth.middleware";
import { AppError } from "../middleware/error.middleware";
import redisClient from "../utils/redis.util";

// @desc    Get all users with pagination and filters
// @route   GET /api/admin/users
// @access  Private/Admin/Moderator
export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter: any = {};

    if (req.query.role) {
      filter.role = req.query.role;
    }

    if (req.query.status) {
      filter.isActive = req.query.status === "active";
    }

    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
      ];
    }

    // Build cache key
    const cacheKey = `users:all:${JSON.stringify({ filter, page, limit })}`;
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      res.status(200).json(JSON.parse(cachedData));
      return;
    }

    const users = await User.find(filter)
      .select("-password")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    const response = {
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    // Cache for 15 minutes
    await redisClient.set(cacheKey, JSON.stringify(response), 900);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin/Moderator
export const getUserById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Build cache key
    const cacheKey = `user:${req.params.id}`;
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      res.status(200).json(JSON.parse(cachedData));
      return;
    }

    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("createdBy", "name email");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const response = {
      success: true,
      user,
    };

    // Cache for 1 hour
    await redisClient.set(cacheKey, JSON.stringify(response), 3600);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new user
// @route   POST /api/admin/users
// @access  Private/Admin/Moderator
export const createUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, role, bio, phone, permissions } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError("User with this email already exists", 400);
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "student",
      bio,
      phone,
      permissions: permissions || [],
      createdBy: req.user!._id,
    });

    // Clear user caches
    await redisClient.delPattern("users:*");

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin/Moderator
export const updateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, bio, phone, avatar, permissions } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (bio !== undefined) user.bio = bio;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;
    if (permissions) user.permissions = permissions;

    await user.save();

    // Clear user caches
    await redisClient.delPattern("users:*");
    await redisClient.del(`user:${user._id}`);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: await User.findById(user._id).select("-password"),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (soft delete)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user!._id.toString()) {
      throw new AppError("You cannot delete your own account", 400);
    }

    // Soft delete
    user.isActive = false;
    await user.save();

    // Clear user caches
    await redisClient.delPattern("users:*");
    await redisClient.del(`user:${user._id}`);

    res.status(200).json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user status (activate/deactivate)
// @route   PATCH /api/admin/users/:id/status
// @access  Private/Admin/Moderator
export const toggleUserStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    user.isActive = !user.isActive;
    await user.save();

    // Clear user caches
    await redisClient.delPattern("users:*");
    await redisClient.del(`user:${user._id}`);

    res.status(200).json({
      success: true,
      message: `User ${
        user.isActive ? "activated" : "deactivated"
      } successfully`,
      user: await User.findById(user._id).select("-password"),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change user role
// @route   PATCH /api/admin/users/:id/role
// @access  Private/Admin
export const changeUserRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role } = req.body;

    if (
      !["student", "admin", "moderator", "teacher", "instructor"].includes(role)
    ) {
      throw new AppError("Invalid role", 400);
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Prevent changing your own role
    if (user._id.toString() === req.user!._id.toString()) {
      throw new AppError("You cannot change your own role", 400);
    }

    user.role = role;
    await user.save();

    // Clear user caches
    await redisClient.delPattern("users:*");
    await redisClient.del(`user:${user._id}`);

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user: await User.findById(user._id).select("-password"),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user statistics
// @route   GET /api/admin/users/stats
// @access  Private/Admin/Moderator
export const getUserStats = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Build cache key
    const cacheKey = `users:stats`;
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      res.status(200).json(JSON.parse(cachedData));
      return;
    }

    const stats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
          active: {
            $sum: { $cond: ["$isActive", 1, 0] },
          },
        },
      },
    ]);

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    const response = {
      success: true,
      stats: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        byRole: stats,
      },
    };

    // Cache for 15 minutes
    await redisClient.set(cacheKey, JSON.stringify(response), 900);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
