import mongoose, { Document, Schema } from 'mongoose';

export interface ILesson {
  title: string;
  videoUrl: string;
  duration: number; // in minutes
  order: number;
}

export interface IModule {
  title: string;
  description: string;
  lessons: ILesson[];
  order: number;
}

export interface ICourse extends Document {
  title: string;
  description: string;
  instructor: string;
  price: number;
  category: string;
  tags: string[];
  thumbnail: string;
  modules: IModule[];
  batch: {
    name: string;
    startDate: Date;
    endDate?: Date;
  };
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  videoUrl: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  order: {
    type: Number,
    required: true
  }
}, { _id: false });

const moduleSchema = new Schema<IModule>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  lessons: [lessonSchema],
  order: {
    type: Number,
    required: true
  }
}, { _id: false });

const courseSchema = new Schema<ICourse>({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    minlength: [20, 'Description must be at least 20 characters']
  },
  instructor: {
    type: String,
    required: [true, 'Instructor name is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Course price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  thumbnail: {
    type: String,
    default: 'https://via.placeholder.com/400x250?text=Course+Thumbnail'
  },
  modules: [moduleSchema],
  batch: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
courseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for search and filter optimization
courseSchema.index({ title: 'text', description: 'text', instructor: 'text' });
courseSchema.index({ category: 1 });
courseSchema.index({ price: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ isPublished: 1 });

export default mongoose.model<ICourse>('Course', courseSchema);
