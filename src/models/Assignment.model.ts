import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAssignment extends Document {
  student: Types.ObjectId;
  course: Types.ObjectId;
  moduleIndex: number;
  title: string;
  description: string;
  submission: {
    answer: string;
    submittedAt: Date;
  };
  review?: {
    feedback: string;
    reviewedBy: Types.ObjectId;
    reviewedAt: Date;
  };
  status: 'pending' | 'submitted' | 'reviewed';
}

const assignmentSchema = new Schema<IAssignment>({
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
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  submission: {
    answer: {
      type: String,
      required: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  review: {
    feedback: String,
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date
  },
  status: {
    type: String,
    enum: ['pending', 'submitted', 'reviewed'],
    default: 'submitted'
  }
});

assignmentSchema.index({ student: 1, course: 1 });
assignmentSchema.index({ course: 1, status: 1 });

export default mongoose.model<IAssignment>('Assignment', assignmentSchema);
