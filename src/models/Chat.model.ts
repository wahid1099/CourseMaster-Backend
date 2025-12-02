import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IChat extends Document {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const chatSchema = new Schema<IChat>({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
chatSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
chatSchema.index({ receiver: 1, isRead: 1 });

export default mongoose.model<IChat>('Chat', chatSchema);
