import User, { IUser } from "../../models/User.model";
import { createTestUser } from "../utils/testHelpers";

describe("User Model", () => {
  describe("User Creation", () => {
    it("should create a user with valid data", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        role: "student" as const,
      };

      const user = await User.create(userData);

      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe(userData.role);
      expect(user.isActive).toBe(true);
      expect(user.password).not.toBe(userData.password); // Should be hashed
    });

    it("should default role to student if not provided", async () => {
      const user = await User.create({
        name: "Default User",
        email: "default@example.com",
        password: "password123",
      });

      expect(user.role).toBe("student");
    });

    it("should set isActive to true by default", async () => {
      const user = await createTestUser();
      expect(user.isActive).toBe(true);
    });
  });

  describe("Validation", () => {
    it("should require name", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it("should require email", async () => {
      const userData = {
        name: "Test User",
        password: "password123",
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it("should require password", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it("should validate email format", async () => {
      const userData = {
        name: "Test User",
        email: "invalid-email",
        password: "password123",
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it("should enforce unique email", async () => {
      await createTestUser({ email: "unique@example.com" });

      await expect(
        User.create({
          name: "Another User",
          email: "unique@example.com",
          password: "password123",
        })
      ).rejects.toThrow();
    });

    it("should validate role enum", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        role: "invalid-role" as any,
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it("should accept valid roles", async () => {
      const roles = ["student", "admin", "moderator", "teacher", "instructor"];

      for (const role of roles) {
        const user = await User.create({
          name: `${role} User`,
          email: `${role}@example.com`,
          password: "password123",
          role: role as any,
        });

        expect(user.role).toBe(role);
      }
    });

    it("should enforce minimum password length", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "12345", // Less than 6 characters
      };

      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe("Password Hashing", () => {
    it("should hash password before saving", async () => {
      const plainPassword = "password123";
      const user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: plainPassword,
      });

      expect(user.password).not.toBe(plainPassword);
      expect(user.password).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt hash pattern
    });

    it("should not rehash password if not modified", async () => {
      const user = await createTestUser();
      const originalHash = user.password;

      user.name = "Updated Name";
      await user.save();

      expect(user.password).toBe(originalHash);
    });

    it("should rehash password if modified", async () => {
      const user = await createTestUser();
      const originalHash = user.password;

      user.password = "newpassword123";
      await user.save();

      expect(user.password).not.toBe(originalHash);
      expect(user.password).toMatch(/^\$2[aby]\$.{56}$/);
    });
  });

  describe("comparePassword Method", () => {
    it("should return true for correct password", async () => {
      const password = "password123";
      const user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password,
      });

      // Fetch user with password field (it's excluded by default)
      const userWithPassword = await User.findById(user._id).select(
        "+password"
      );
      const isMatch = await userWithPassword!.comparePassword(password);

      expect(isMatch).toBe(true);
    });

    it("should return false for incorrect password", async () => {
      const user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

      const userWithPassword = await User.findById(user._id).select(
        "+password"
      );
      const isMatch = await userWithPassword!.comparePassword("wrongpassword");

      expect(isMatch).toBe(false);
    });
  });

  describe("Optional Fields", () => {
    it("should allow optional bio field", async () => {
      const user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        bio: "This is my bio",
      });

      expect(user.bio).toBe("This is my bio");
    });

    it("should allow optional avatar field", async () => {
      const user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        avatar: "https://example.com/avatar.jpg",
      });

      expect(user.avatar).toBe("https://example.com/avatar.jpg");
    });

    it("should allow optional phone field", async () => {
      const user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        phone: "+1234567890",
      });

      expect(user.phone).toBe("+1234567890");
    });

    it("should enforce max length for bio", async () => {
      const longBio = "a".repeat(501); // More than 500 characters

      await expect(
        User.create({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
          bio: longBio,
        })
      ).rejects.toThrow();
    });
  });

  describe("Timestamps", () => {
    it("should automatically set createdAt and updatedAt", async () => {
      const user = await createTestUser();

      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it("should update updatedAt on save", async () => {
      const user = await createTestUser();
      const originalUpdatedAt = user.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      user.name = "Updated Name";
      await user.save();

      expect(user.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });
});
