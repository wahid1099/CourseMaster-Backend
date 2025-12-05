import { Request, Response, NextFunction } from "express";
import {
  register,
  login,
  logout,
  getMe,
} from "../../controllers/auth.controller";
import User from "../../models/User.model";
import { createTestUser, generateTestToken } from "../utils/testHelpers";
import { AuthRequest } from "../../middleware/auth.middleware";

// Mock email service
jest.mock("../../utils/email.util", () => ({
  __esModule: true,
  default: {
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  },
}));

describe("Auth Controller", () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      user: undefined,
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe("register", () => {
    it("should register a new student successfully", async () => {
      mockRequest.body = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        role: "student",
      };

      await register(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: expect.any(String),
          user: expect.objectContaining({
            name: "John Doe",
            email: "john@example.com",
            role: "student",
          }),
        })
      );

      // Verify user was created in database
      const user = await User.findOne({ email: "john@example.com" });
      expect(user).toBeTruthy();
      expect(user?.name).toBe("John Doe");
    });

    it("should register an admin with valid admin key", async () => {
      mockRequest.body = {
        name: "Admin User",
        email: "admin@example.com",
        password: "password123",
        role: "admin",
        adminKey: "test-admin-key-123",
      };

      await register(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          user: expect.objectContaining({
            role: "admin",
          }),
        })
      );
    });

    it("should reject admin registration with invalid admin key", async () => {
      mockRequest.body = {
        name: "Admin User",
        email: "admin@example.com",
        password: "password123",
        role: "admin",
        adminKey: "wrong-key",
      };

      await register(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid admin key",
          statusCode: 403,
        })
      );
    });

    it("should reject registration with duplicate email", async () => {
      // Create a user first
      await createTestUser({ email: "duplicate@example.com" });

      mockRequest.body = {
        name: "Another User",
        email: "duplicate@example.com",
        password: "password123",
        role: "student",
      };

      await register(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it("should default to student role if no role provided", async () => {
      mockRequest.body = {
        name: "Default User",
        email: "default@example.com",
        password: "password123",
      };

      await register(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            role: "student",
          }),
        })
      );
    });
  });

  describe("login", () => {
    it("should login user with valid credentials", async () => {
      // Create a test user
      const user = await createTestUser({
        email: "login@example.com",
        password: "password123",
      });

      mockRequest.body = {
        email: "login@example.com",
        password: "password123",
      };

      await login(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: expect.any(String),
          user: expect.objectContaining({
            email: "login@example.com",
          }),
        })
      );
    });

    it("should reject login with invalid email", async () => {
      mockRequest.body = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      await login(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid credentials",
          statusCode: 401,
        })
      );
    });

    it("should reject login with invalid password", async () => {
      await createTestUser({
        email: "test@example.com",
        password: "correctpassword",
      });

      mockRequest.body = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      await login(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid credentials",
          statusCode: 401,
        })
      );
    });
  });

  describe("logout", () => {
    it("should logout user successfully", async () => {
      await logout(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        "token",
        "none",
        expect.objectContaining({
          httpOnly: true,
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Logged out successfully",
        })
      );
    });
  });

  describe("getMe", () => {
    it("should return current user data", async () => {
      const user = await createTestUser();
      mockRequest.user = {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      await getMe(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          user: expect.objectContaining({
            email: user.email,
            name: user.name,
            role: user.role,
          }),
        })
      );
    });
  });
});
