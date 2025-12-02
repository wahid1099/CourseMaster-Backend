import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAssignment extends Document {
  student?: Types.ObjectId; // Optional for batch assignments
  course: Types.ObjectId;
  batch?: string; // For batch assignments
  moduleIndex?: number; // Optional for general assignments
  title: string;
  description: string;
  dueDate?: Date;
  createdBy: Types.ObjectId; // Admin/instructor who created it
  submission?: {
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
    required: false // Optional for batch assignments
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  batch: {
    type: String,
    required: false // For batch assignments
  },
  moduleIndex: {
    type: Number,
    required: false, // Optional for general assignments
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
  dueDate: {
    type: Date,
    required: false
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submission: {
    answer: {
      type: String,
      required: false
    },
    submittedAt: {
      type: Date
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
    default: 'pending'
  }
});

assignmentSchema.index({ student: 1, course: 1 });
assignmentSchema.index({ course: 1, status: 1 });

export default mongoose.model<IAssignment>('Assignment', assignmentSchema);
