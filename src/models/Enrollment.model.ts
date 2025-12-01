import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IEnrollment extends Document {
  student: Types.ObjectId;
  course: Types.ObjectId;
  enrolledAt: Date;
  progress: number; // 0-100
  completedLessons: number;
  totalLessons: number;
  isCompleted: boolean;
  completedAt?: Date;
}

const enrollmentSchema = new Schema<IEnrollment>({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completedLessons: {
    type: Number,
    default: 0,
    min: 0
  },
  totalLessons: {
    type: Number,
    required: true,
    min: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: Date
});

// Compound index to ensure one enrollment per student per course
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ student: 1 });
enrollmentSchema.index({ course: 1 });

export default mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);
