import request from "supertest";
import express, { Express } from "express";
import mongoose from "mongoose";
import authRoutes from "../../routes/auth.routes";
import User from "../../models/User.model";
import { errorHandler } from "../../middleware/error.middleware";
import cookieParser from "cookie-parser";

describe("Auth Integration Tests", () => {
  let app: Express;

  beforeAll(() => {
    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api/auth", authRoutes);
    app.use(errorHandler);
  });

  describe("POST /api/auth/register", () => {
    it("should register a new student successfully", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
          role: "student",
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        token: expect.any(String),
        user: {
          name: "John Doe",
          email: "john@example.com",
          role: "student",
        },
      });

      // Verify user exists in database
      const user = await User.findOne({ email: "john@example.com" });
      expect(user).toBeTruthy();
    });

    it("should register an admin with valid admin key", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Admin User",
          email: "admin@example.com",
          password: "password123",
          role: "admin",
          adminKey: "test-admin-key-123",
        })
        .expect(201);

      expect(response.body.user.role).toBe("admin");
    });

    it("should reject admin registration with invalid admin key", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Admin User",
          email: "admin2@example.com",
          password: "password123",
          role: "admin",
          adminKey: "wrong-key",
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it("should reject registration with duplicate email", async () => {
      // Register first user
      await request(app).post("/api/auth/register").send({
        name: "First User",
        email: "duplicate@example.com",
        password: "password123",
      });

      // Try to register with same email
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Second User",
          email: "duplicate@example.com",
          password: "password123",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject registration with invalid email", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "invalid-email",
          password: "password123",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject registration with short password", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "test@example.com",
          password: "12345", // Less than 6 characters
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should set cookie with token", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Cookie User",
          email: "cookie@example.com",
          password: "password123",
        })
        .expect(201);

      expect(response.headers["set-cookie"]).toBeDefined();
      expect(response.headers["set-cookie"][0]).toMatch(/token=/);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Create a test user before each login test
      await User.create({
        name: "Login User",
        email: "login@example.com",
        password: "password123",
      });
    });

    it("should login with valid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "login@example.com",
          password: "password123",
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        token: expect.any(String),
        user: {
          email: "login@example.com",
        },
      });
    });

    it("should reject login with invalid email", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/invalid credentials/i);
    });

    it("should reject login with invalid password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "login@example.com",
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/invalid credentials/i);
    });

    it("should set cookie with token on successful login", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "login@example.com",
          password: "password123",
        })
        .expect(200);

      expect(response.headers["set-cookie"]).toBeDefined();
      expect(response.headers["set-cookie"][0]).toMatch(/token=/);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return current user with valid token", async () => {
      // Register a user first
      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Me User",
          email: "me@example.com",
          password: "password123",
        });

      const token = registerResponse.body.token;

      // Get current user
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        user: {
          email: "me@example.com",
          name: "Me User",
        },
      });
    });

    it("should reject request without token", async () => {
      const response = await request(app).get("/api/auth/me").expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should reject request with invalid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should logout user successfully", async () => {
      // Register and login first
      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Logout User",
          email: "logout@example.com",
          password: "password123",
        });

      const token = registerResponse.body.token;

      // Logout
      const response = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Logged out successfully",
      });

      // Cookie should be cleared
      expect(response.headers["set-cookie"]).toBeDefined();
      expect(response.headers["set-cookie"][0]).toMatch(/token=none/);
    });
  });
});
