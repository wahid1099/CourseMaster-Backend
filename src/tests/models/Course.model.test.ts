import Course, { ICourse } from "../../models/Course.model";
import { createTestCourse } from "../utils/testHelpers";

describe("Course Model", () => {
  describe("Course Creation", () => {
    it("should create a course with valid data", async () => {
      const courseData = {
        title: "Introduction to JavaScript",
        description: "Learn JavaScript from scratch with hands-on examples",
        instructor: "John Doe",
        price: 99.99,
        category: "Programming",
        tags: ["javascript", "web development"],
        modules: [
          {
            title: "Getting Started",
            description: "Introduction to the course",
            order: 1,
            lessons: [
              {
                title: "Welcome",
                videoUrl: "https://example.com/video1.mp4",
                duration: 10,
                order: 1,
              },
            ],
          },
        ],
        batch: {
          name: "Batch 2024",
          startDate: new Date("2024-01-01"),
        },
      };

      const course = await Course.create(courseData);

      expect(course.title).toBe(courseData.title);
      expect(course.description).toBe(courseData.description);
      expect(course.instructor).toBe(courseData.instructor);
      expect(course.price).toBe(courseData.price);
      expect(course.category).toBe(courseData.category);
      expect(course.isPublished).toBe(true); // Default value
    });

    it("should set default thumbnail if not provided", async () => {
      const course = await createTestCourse();
      expect(course.thumbnail).toBeTruthy();
    });

    it("should set isPublished to true by default", async () => {
      const course = await createTestCourse();
      expect(course.isPublished).toBe(true);
    });
  });

  describe("Validation", () => {
    it("should require title", async () => {
      const courseData = {
        description: "Test description for the course",
        instructor: "John Doe",
        price: 99.99,
        category: "Programming",
        batch: {
          name: "Batch 2024",
          startDate: new Date(),
        },
      };

      await expect(Course.create(courseData)).rejects.toThrow();
    });

    it("should require description", async () => {
      const courseData = {
        title: "Test Course",
        instructor: "John Doe",
        price: 99.99,
        category: "Programming",
        batch: {
          name: "Batch 2024",
          startDate: new Date(),
        },
      };

      await expect(Course.create(courseData)).rejects.toThrow();
    });

    it("should require instructor", async () => {
      const courseData = {
        title: "Test Course",
        description: "Test description for the course",
        price: 99.99,
        category: "Programming",
        batch: {
          name: "Batch 2024",
          startDate: new Date(),
        },
      };

      await expect(Course.create(courseData)).rejects.toThrow();
    });

    it("should require price", async () => {
      const courseData = {
        title: "Test Course",
        description: "Test description for the course",
        instructor: "John Doe",
        category: "Programming",
        batch: {
          name: "Batch 2024",
          startDate: new Date(),
        },
      };

      await expect(Course.create(courseData)).rejects.toThrow();
    });

    it("should require category", async () => {
      const courseData = {
        title: "Test Course",
        description: "Test description for the course",
        instructor: "John Doe",
        price: 99.99,
        batch: {
          name: "Batch 2024",
          startDate: new Date(),
        },
      };

      await expect(Course.create(courseData)).rejects.toThrow();
    });

    it("should enforce minimum title length", async () => {
      await expect(
        createTestCourse({ title: "Test" }) // Less than 5 characters
      ).rejects.toThrow();
    });

    it("should enforce maximum title length", async () => {
      const longTitle = "a".repeat(101); // More than 100 characters

      await expect(createTestCourse({ title: longTitle })).rejects.toThrow();
    });

    it("should enforce minimum description length", async () => {
      await expect(
        createTestCourse({ description: "Short" }) // Less than 20 characters
      ).rejects.toThrow();
    });

    it("should not allow negative price", async () => {
      await expect(createTestCourse({ price: -10 })).rejects.toThrow();
    });

    it("should allow zero price for free courses", async () => {
      const course = await createTestCourse({ price: 0 });
      expect(course.price).toBe(0);
    });
  });

  describe("Modules and Lessons", () => {
    it("should create course with multiple modules", async () => {
      const course = await createTestCourse({
        modules: [
          {
            title: "Module 1",
            description: "First module",
            order: 1,
            lessons: [
              {
                title: "Lesson 1",
                videoUrl: "https://example.com/video1.mp4",
                duration: 30,
                order: 1,
              },
            ],
          },
          {
            title: "Module 2",
            description: "Second module",
            order: 2,
            lessons: [
              {
                title: "Lesson 2",
                videoUrl: "https://example.com/video2.mp4",
                duration: 45,
                order: 1,
              },
            ],
          },
        ],
      });

      expect(course.modules).toHaveLength(2);
      expect(course.modules[0].title).toBe("Module 1");
      expect(course.modules[1].title).toBe("Module 2");
    });

    it("should create module with multiple lessons", async () => {
      const course = await createTestCourse({
        modules: [
          {
            title: "Module 1",
            description: "First module",
            order: 1,
            lessons: [
              {
                title: "Lesson 1",
                videoUrl: "https://example.com/video1.mp4",
                duration: 30,
                order: 1,
              },
              {
                title: "Lesson 2",
                videoUrl: "https://example.com/video2.mp4",
                duration: 45,
                order: 2,
              },
            ],
          },
        ],
      });

      expect(course.modules[0].lessons).toHaveLength(2);
      expect(course.modules[0].lessons[0].title).toBe("Lesson 1");
      expect(course.modules[0].lessons[1].title).toBe("Lesson 2");
    });

    it("should require lesson duration to be positive", async () => {
      await expect(
        createTestCourse({
          modules: [
            {
              title: "Module 1",
              description: "First module",
              order: 1,
              lessons: [
                {
                  title: "Lesson 1",
                  videoUrl: "https://example.com/video1.mp4",
                  duration: 0, // Invalid
                  order: 1,
                },
              ],
            },
          ],
        })
      ).rejects.toThrow();
    });
  });

  describe("Batch Information", () => {
    it("should require batch name", async () => {
      await expect(
        createTestCourse({
          batch: {
            name: "",
            startDate: new Date(),
          } as any,
        })
      ).rejects.toThrow();
    });

    it("should require batch start date", async () => {
      await expect(
        createTestCourse({
          batch: {
            name: "Batch 2024",
          } as any,
        })
      ).rejects.toThrow();
    });

    it("should allow optional batch end date", async () => {
      const course = await createTestCourse({
        batch: {
          name: "Batch 2024",
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-12-31"),
        },
      });

      expect(course.batch.endDate).toBeInstanceOf(Date);
    });
  });

  describe("Timestamps", () => {
    it("should automatically set createdAt and updatedAt", async () => {
      const course = await createTestCourse();

      expect(course.createdAt).toBeInstanceOf(Date);
      expect(course.updatedAt).toBeInstanceOf(Date);
    });

    it("should update updatedAt on save", async () => {
      const course = await createTestCourse();
      const originalUpdatedAt = course.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      course.title = "Updated Title";
      await course.save();

      expect(course.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe("Tags", () => {
    it("should allow multiple tags", async () => {
      const course = await createTestCourse({
        tags: ["javascript", "react", "web development"],
      });

      expect(course.tags).toHaveLength(3);
      expect(course.tags).toContain("javascript");
      expect(course.tags).toContain("react");
    });

    it("should allow empty tags array", async () => {
      const course = await createTestCourse({ tags: [] });
      expect(course.tags).toHaveLength(0);
    });
  });
});
