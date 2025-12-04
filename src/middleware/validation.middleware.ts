import { Request, Response, NextFunction } from "express";
import Joi, { ObjectSchema } from "joi";

// Validation schemas
const schemas: { [key: string]: ObjectSchema } = {
  // Auth schemas
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid(
      "student",
      "admin",
      "moderator",
      "teacher",
      "instructor"
    ),
    adminKey: Joi.string().when("role", {
      is: Joi.string().valid("admin", "moderator"),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  // Course schemas
  course: Joi.object({
    title: Joi.string().min(5).max(100).required(),
    description: Joi.string().min(20).required(),
    instructor: Joi.string().required(),
    price: Joi.number().min(0).required(),
    category: Joi.string().required(),
    tags: Joi.array().items(Joi.string()),
    thumbnail: Joi.string().uri(),
    modules: Joi.array().items(
      Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        order: Joi.number().required(),
        lessons: Joi.array().items(
          Joi.object({
            title: Joi.string().required(),
            videoUrl: Joi.string().uri().required(),
            duration: Joi.number().min(1).required(),
            order: Joi.number().required(),
          })
        ),
      })
    ),
    batch: Joi.object({
      name: Joi.string().required(),
      startDate: Joi.date().required(),
      endDate: Joi.date(),
    }),
    isPublished: Joi.boolean(),
  }),

  // Assignment schemas
  assignment: Joi.object({
    courseId: Joi.string().required(),
    moduleIndex: Joi.number().min(0).required(),
    title: Joi.string().required(),
    description: Joi.string().required(),
    answer: Joi.string().required(),
  }),

  // Quiz schemas
  quiz: Joi.object({
    courseId: Joi.string().required(),
    moduleIndex: Joi.number().min(0).required(),
    title: Joi.string().required(),
    questions: Joi.array()
      .items(
        Joi.object({
          question: Joi.string().required(),
          options: Joi.array().items(Joi.string()).min(2).required(),
          correctAnswer: Joi.number().min(0).required(),
        })
      )
      .min(1)
      .required(),
    passingScore: Joi.number().min(0).max(100),
  }),

  // User management schemas
  createUser: Joi.object({
    name: Joi.string().required().trim().min(2).max(100),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(6),
    role: Joi.string().valid(
      "student",
      "admin",
      "moderator",
      "teacher",
      "instructor"
    ),
    bio: Joi.string().max(500),
    phone: Joi.string().pattern(/^[0-9+\-\s()]+$/),
    permissions: Joi.array().items(Joi.string()),
  }),

  updateUser: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    email: Joi.string().email(),
    bio: Joi.string().max(500).allow(""),
    phone: Joi.string()
      .pattern(/^[0-9+\-\s()]+$/)
      .allow(""),
    avatar: Joi.string().uri().allow(""),
    permissions: Joi.array().items(Joi.string()),
  }),
};

export const validate = (schemaName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const schema = schemas[schemaName];

    if (!schema) {
      res.status(500).json({
        success: false,
        message: "Validation schema not found",
      });
      return;
    }

    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
      return;
    }

    next();
  };
};

// Export individual schemas for direct use
export const registerSchema = schemas.register;
export const loginSchema = schemas.login;
export const courseSchema = schemas.course;
export const assignmentSchema = schemas.assignment;
export const quizSchema = schemas.quiz;
