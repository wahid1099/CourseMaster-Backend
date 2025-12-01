import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IProgress extends Document {
  student: Types.ObjectId;
  course: Types.ObjectId;
  moduleIndex: number;
  lessonIndex: number;
  completedAt: Date;
}

const progressSchema = new Schema<IProgress>({
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
  moduleIndex: {
    type: Number,
    required: true,
    min: 0
  },
  lessonIndex: {
    type: Number,
    required: true,
    min: 0
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound unique index to prevent duplicate lesson completions
progressSchema.index({ student: 1, course: 1, moduleIndex: 1, lessonIndex: 1 }, { unique: true });
progressSchema.index({ student: 1, course: 1 });

export default mongoose.model<IProgress>('Progress', progressSchema);
