import mongoose, { Schema } from 'mongoose';
import { ITask, TaskPriority, TaskStatus } from '../types';

/**
 * Task Schema for MongoDB
 * Handles all task-related data with comprehensive fields
 */
const TaskSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    minlength: [1, 'Title must be at least 1 character long'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Task description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  priority: {
    type: String,
    enum: Object.values(TaskPriority),
    default: TaskPriority.MEDIUM,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(TaskStatus),
    default: TaskStatus.PENDING,
    required: true
  },
  category: {
    type: String,
    trim: true,
    maxlength: [30, 'Category cannot exceed 30 characters'],
    default: 'General'
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
    validate: {
      validator: function(value: Date) {
        return value >= new Date();
      },
      message: 'Due date cannot be in the past'
    }
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true // Index for faster queries
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  versionKey: false
});

/**
 * Pre-save middleware to set completedAt when status changes to completed
 */
TaskSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === TaskStatus.COMPLETED && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== TaskStatus.COMPLETED) {
      this.completedAt = null;
    }
  }
  next();
});

/**
 * Index for efficient querying by user and status
 */
TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, priority: 1 });
TaskSchema.index({ userId: 1, dueDate: 1 });

/**
 * Static method to get tasks with smart sorting algorithm
 * Combines priority, due date proximity, and creation time
 */
TaskSchema.statics.getSmartSortedTasks = function(userId: string, filters: any = {}) {
  const now = new Date();
  
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        ...filters
      }
    },
    {
      $addFields: {
        // Calculate priority score (high=3, medium=2, low=1)
        priorityScore: {
          $switch: {
            branches: [
              { case: { $eq: ['$priority', 'high'] }, then: 3 },
              { case: { $eq: ['$priority', 'medium'] }, then: 2 },
              { case: { $eq: ['$priority', 'low'] }, then: 1 }
            ],
            default: 2
          }
        },
        // Calculate urgency score based on dueDate proximity
        urgencyScore: {
          $cond: {
            if: { $lte: ['$dueDate', now] },
            then: 10, // Overdue tasks get highest urgency
            else: {
              $divide: [
                86400000, // milliseconds in a day
                { $subtract: ['$dueDate', now] }
              ]
            }
          }
        }
      }
    },
    {
      $addFields: {
        // Combined score for smart sorting
        smartScore: {
          $add: [
            { $multiply: ['$priorityScore', 2] }, // Priority weight: 2x
            { $multiply: ['$urgencyScore', 3] },  // Urgency weight: 3x
            { $divide: [{ $subtract: [now, '$createdAt'] }, 86400000] } // Age factor
          ]
        }
      }
    },
    {
      $sort: {
        status: 1, // Pending tasks first
        smartScore: -1, // Higher score first
        createdAt: -1 // Newer tasks first for same score
      }
    }
  ]);
};

export default mongoose.model<ITask>('Task', TaskSchema);
