import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Misun Academy API",
      version: "1.0.0",
      description:
        "Comprehensive EdTech Platform API for course management, quizzes, assignments, and student enrollment",
      contact: {
        name: "Misun Academy",
        email: "support@misunacademy.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
      {
        url: "https://course-master-backend-chi.vercel.app",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "507f1f77bcf86cd799439011" },
            name: { type: "string", example: "John Doe" },
            email: { type: "string", example: "john@example.com" },
            role: {
              type: "string",
              enum: ["student", "admin", "moderator", "teacher", "instructor"],
              example: "student",
            },
            avatar: {
              type: "string",
              example: "https://example.com/avatar.jpg",
            },
            bio: { type: "string", example: "Passionate learner" },
            phone: { type: "string", example: "+1234567890" },
            isActive: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Course: {
          type: "object",
          properties: {
            _id: { type: "string", example: "507f1f77bcf86cd799439011" },
            title: {
              type: "string",
              example: "Introduction to Web Development",
            },
            description: {
              type: "string",
              example: "Learn the basics of web development",
            },
            category: { type: "string", example: "Programming" },
            price: { type: "number", example: 99.99 },
            thumbnail: {
              type: "string",
              example: "https://example.com/thumbnail.jpg",
            },
            tags: {
              type: "array",
              items: { type: "string" },
              example: ["web", "javascript", "html"],
            },
            isPublished: { type: "boolean", example: true },
            modules: { type: "array", items: { type: "object" } },
          },
        },
        Quiz: {
          type: "object",
          properties: {
            _id: { type: "string", example: "507f1f77bcf86cd799439011" },
            title: { type: "string", example: "JavaScript Basics Quiz" },
            course: { type: "string", example: "507f1f77bcf86cd799439011" },
            moduleIndex: { type: "number", example: 0 },
            passingScore: { type: "number", example: 70 },
            questions: { type: "array", items: { type: "object" } },
          },
        },
        Assignment: {
          type: "object",
          properties: {
            _id: { type: "string", example: "507f1f77bcf86cd799439011" },
            title: { type: "string", example: "Build a Calculator" },
            description: {
              type: "string",
              example:
                "Create a simple calculator using HTML, CSS, and JavaScript",
            },
            course: { type: "string", example: "507f1f77bcf86cd799439011" },
            student: { type: "string", example: "507f1f77bcf86cd799439011" },
            status: {
              type: "string",
              enum: ["pending", "submitted", "reviewed"],
              example: "pending",
            },
            submission: { type: "object" },
            review: { type: "object" },
          },
        },
        Enrollment: {
          type: "object",
          properties: {
            _id: { type: "string", example: "507f1f77bcf86cd799439011" },
            student: { type: "string", example: "507f1f77bcf86cd799439011" },
            course: { type: "string", example: "507f1f77bcf86cd799439011" },
            progress: { type: "number", example: 45.5 },
            completedLessons: { type: "number", example: 5 },
            totalLessons: { type: "number", example: 11 },
            isCompleted: { type: "boolean", example: false },
            enrolledAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Error message" },
            statusCode: { type: "number", example: 400 },
          },
        },
      },
    },
    tags: [
      { name: "Authentication", description: "User authentication endpoints" },
      { name: "Courses", description: "Course management endpoints" },
      {
        name: "Quizzes",
        description: "Quiz management and submission endpoints",
      },
      {
        name: "Assignments",
        description: "Assignment management and submission endpoints",
      },
      { name: "Enrollments", description: "Student enrollment endpoints" },
      { name: "Users", description: "User management endpoints (Admin)" },
      { name: "Chat", description: "Real-time chat endpoints" },
      { name: "Health", description: "System health and status endpoints" },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/server.ts"], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
