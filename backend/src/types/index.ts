import { Document } from 'mongoose';

// User interface for authentication
export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Task priority levels
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

// Task status
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

// Task interface
export interface ITask extends Document {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: Date;
  category?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response interface
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// JWT Payload interface
export interface JWTPayload {
  userId: string;
  email: string;
}

// Request with user interface (for authenticated routes)
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}
