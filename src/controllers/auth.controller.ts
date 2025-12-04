import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.model";
import { AuthRequest } from "../middleware/auth.middleware";
import { AppError } from "../middleware/error.middleware";
import emailService from "../utils/email.util";

// Generate JWT Token
const generateToken = (id: string): string => {
  const expiresIn = (process.env.JWT_EXPIRE || "7d") as string;
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn,
  } as jwt.SignOptions);
};

// Send token response
const sendTokenResponse = (
  user: any,
  statusCode: number,
  res: Response
): void => {
  const token = generateToken(user._id);

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: true, // Always true (required for sameSite: 'none')
    sameSite: "none" as const, // Changed from 'strict' to 'none' for cross-origin
  };

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      token,
      user: {
        _id: user._id, // Added for frontend compatibility
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, role, adminKey } = req.body;

    // Check if admin registration and validate admin key
    if (role === "admin") {
      if (adminKey !== process.env.ADMIN_KEY) {
        throw new AppError("Invalid admin key", 403);
      }
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || "student",
    });

    // Send welcome email (non-blocking)
    emailService
      .sendWelcomeEmail(user.name, user.email)
      .catch((err) => console.error("Welcome email failed:", err));

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      throw new AppError("Invalid credentials", 401);
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.cookie("token", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id);

    res.status(200).json({
      success: true,
      user: {
        _id: user!._id,
        id: user!._id,
        name: user!.name,
        email: user!.email,
        role: user!.role,
      },
    });
  } catch (error) {
    next(error);
  }
};
