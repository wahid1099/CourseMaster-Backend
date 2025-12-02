import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
}

export interface IQuiz extends Document {
  course?: Types.ObjectId; // Optional for standalone quizzes
  moduleIndex?: number; // Optional for standalone quizzes
  title: string;
  questions: IQuizQuestion[];
  passingScore: number; // percentage
}

export interface IQuizAttempt extends Document {
  student: Types.ObjectId;
  quiz: Types.ObjectId;
  answers: number[];
  score: number;
  passed: boolean;
  attemptedAt: Date;
}

const quizQuestionSchema = new Schema<IQuizQuestion>({
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctAnswer: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const quizSchema = new Schema<IQuiz>({
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: false // Make optional for standalone quizzes
  },
  moduleIndex: {
    type: Number,
    required: false, // Make optional for standalone quizzes
    min: 0
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  questions: [quizQuestionSchema],
  passingScore: {
    type: Number,
    default: 70,
    min: 0,
    max: 100
  }
});

const quizAttemptSchema = new Schema<IQuizAttempt>({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quiz: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  answers: [{
    type: Number,
    required: true
  }],
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  passed: {
    type: Boolean,
    required: true
  },
  attemptedAt: {
    type: Date,
    default: Date.now
  }
});

quizSchema.index({ course: 1, moduleIndex: 1 });
quizAttemptSchema.index({ student: 1, quiz: 1 });

export const Quiz = mongoose.model<IQuiz>('Quiz', quizSchema);
export const QuizAttempt = mongoose.model<IQuizAttempt>('QuizAttempt', quizAttemptSchema);
