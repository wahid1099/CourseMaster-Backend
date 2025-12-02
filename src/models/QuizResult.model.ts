import mongoose, { Document, Schema } from 'mongoose';

export interface IQuizResult extends Document {
  student: mongoose.Types.ObjectId;
  quiz: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  answers: number[]; // array of selected option indices
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  timeSpent: number; // seconds
  submittedAt: Date;
}

const quizResultSchema = new Schema<IQuizResult>({
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
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  answers: [{
    type: Number,
    required: true
  }],
  score: {
    type: Number,
    required: true
  },
  totalPoints: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  passed: {
    type: Boolean,
    required: true
  },
  timeSpent: {
    type: Number,
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
quizResultSchema.index({ student: 1, quiz: 1 });
quizResultSchema.index({ student: 1, course: 1 });
quizResultSchema.index({ submittedAt: -1 });

export default mongoose.model<IQuizResult>('QuizResult', quizResultSchema);
