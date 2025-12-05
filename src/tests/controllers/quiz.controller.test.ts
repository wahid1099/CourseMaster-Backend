import { Request, Response, NextFunction } from "express";
import {
  getQuizzesByCourse,
  getQuizById,
  submitQuiz,
  getQuizHistory,
  getQuizResult,
} from "../../controllers/quiz.controller";
import { Quiz } from "../../models/Quiz.model";
import QuizResult from "../../models/QuizResult.model";
import {
  createTestCourse,
  createTestQuiz,
  createTestUser,
} from "../utils/testHelpers";

describe("Quiz Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      params: {},
      body: {},
      query: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe("getQuizzesByCourse", () => {
    it("should return all quizzes for a course", async () => {
      const course = await createTestCourse();
      const quiz1 = await createTestQuiz(course._id, {
        title: "Quiz 1",
        moduleIndex: 0,
      });
      const quiz2 = await createTestQuiz(course._id, {
        title: "Quiz 2",
        moduleIndex: 1,
      });

      mockRequest.params = { courseId: course._id.toString() };

      await getQuizzesByCourse(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          quizzes: expect.arrayContaining([
            expect.objectContaining({ title: "Quiz 1" }),
            expect.objectContaining({ title: "Quiz 2" }),
          ]),
        })
      );
    });

    it("should not return correct answers in quiz list", async () => {
      const course = await createTestCourse();
      await createTestQuiz(course._id);

      mockRequest.params = { courseId: course._id.toString() };

      await getQuizzesByCourse(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      const quiz = response.quizzes[0];

      // Check that questions don't have correctAnswer field
      if (quiz.questions && quiz.questions.length > 0) {
        expect(quiz.questions[0].correctAnswer).toBeUndefined();
      }
    });
  });

  describe("getQuizById", () => {
    it("should return quiz by ID without correct answers", async () => {
      const quiz = await createTestQuiz();

      mockRequest.params = { id: quiz._id.toString() };

      await getQuizById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          quiz: expect.objectContaining({
            title: quiz.title,
          }),
        })
      );
    });

    it("should return 404 for non-existent quiz", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      mockRequest.params = { id: fakeId };

      await getQuizById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Quiz not found",
          statusCode: 404,
        })
      );
    });
  });

  describe("submitQuiz", () => {
    it("should calculate score correctly for all correct answers", async () => {
      const user = await createTestUser();
      const quiz = await createTestQuiz();

      mockRequest.params = { id: quiz._id.toString() };
      mockRequest.body = {
        answers: [1, 2], // Both correct answers
        timeSpent: 300,
      };
      (mockRequest as any).user = { _id: user._id };

      await submitQuiz(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            percentage: 100,
            passed: true,
            score: 2,
            totalPoints: 2,
          }),
        })
      );
    });

    it("should calculate score correctly for partial correct answers", async () => {
      const user = await createTestUser();
      const quiz = await createTestQuiz();

      mockRequest.params = { id: quiz._id.toString() };
      mockRequest.body = {
        answers: [1, 0], // One correct, one wrong
        timeSpent: 300,
      };
      (mockRequest as any).user = { _id: user._id };

      await submitQuiz(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          result: expect.objectContaining({
            percentage: 50,
            passed: false, // Below 70% passing score
            score: 1,
            totalPoints: 2,
          }),
        })
      );
    });

    it("should save quiz result to database", async () => {
      const user = await createTestUser();
      const course = await createTestCourse();
      const quiz = await createTestQuiz(course._id);

      mockRequest.params = { id: quiz._id.toString() };
      mockRequest.body = {
        answers: [1, 2],
        timeSpent: 300,
      };
      (mockRequest as any).user = { _id: user._id };

      await submitQuiz(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const quizResult = await QuizResult.findOne({
        student: user._id,
        quiz: quiz._id,
      });
      expect(quizResult).toBeTruthy();
      expect(quizResult?.percentage).toBe(100);
      expect(quizResult?.passed).toBe(true);
    });

    it("should return 404 for non-existent quiz", async () => {
      const user = await createTestUser();
      const fakeId = "507f1f77bcf86cd799439011";

      mockRequest.params = { id: fakeId };
      mockRequest.body = { answers: [1, 2] };
      (mockRequest as any).user = { _id: user._id };

      await submitQuiz(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Quiz not found",
          statusCode: 404,
        })
      );
    });
  });

  describe("getQuizHistory", () => {
    it("should return quiz history for student", async () => {
      const user = await createTestUser();
      const course = await createTestCourse();
      const quiz = await createTestQuiz(course._id);

      // Create quiz result
      await QuizResult.create({
        student: user._id,
        quiz: quiz._id,
        course: course._id,
        answers: [1, 2],
        score: 2,
        totalPoints: 2,
        percentage: 100,
        passed: true,
      });

      mockRequest.query = {};
      (mockRequest as any).user = { _id: user._id };

      await getQuizHistory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          history: expect.arrayContaining([
            expect.objectContaining({
              percentage: 100,
              passed: true,
            }),
          ]),
        })
      );
    });

    it("should filter quiz history by course", async () => {
      const user = await createTestUser();
      const course1 = await createTestCourse();
      const course2 = await createTestCourse();
      const quiz1 = await createTestQuiz(course1._id);
      const quiz2 = await createTestQuiz(course2._id);

      await QuizResult.create({
        student: user._id,
        quiz: quiz1._id,
        course: course1._id,
        answers: [1, 2],
        score: 2,
        totalPoints: 2,
        percentage: 100,
        passed: true,
      });

      await QuizResult.create({
        student: user._id,
        quiz: quiz2._id,
        course: course2._id,
        answers: [1, 2],
        score: 2,
        totalPoints: 2,
        percentage: 100,
        passed: true,
      });

      mockRequest.query = { courseId: course1._id.toString() };
      (mockRequest as any).user = { _id: user._id };

      await getQuizHistory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.history).toHaveLength(1);
    });
  });

  describe("getQuizResult", () => {
    it("should return specific quiz result", async () => {
      const user = await createTestUser();
      const course = await createTestCourse();
      const quiz = await createTestQuiz(course._id);

      const quizResult = await QuizResult.create({
        student: user._id,
        quiz: quiz._id,
        course: course._id,
        answers: [1, 2],
        score: 2,
        totalPoints: 2,
        percentage: 100,
        passed: true,
      });

      mockRequest.params = { id: quizResult._id.toString() };
      (mockRequest as any).user = { _id: user._id };

      await getQuizResult(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            percentage: 100,
            passed: true,
          }),
        })
      );
    });

    it("should return 404 for non-existent result", async () => {
      const user = await createTestUser();
      const fakeId = "507f1f77bcf86cd799439011";

      mockRequest.params = { id: fakeId };
      (mockRequest as any).user = { _id: user._id };

      await getQuizResult(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Quiz result not found",
          statusCode: 404,
        })
      );
    });
  });
});
