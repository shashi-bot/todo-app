import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task';
import { ApiResponse, TaskStatus, TaskPriority } from '../types';

/**
 * Create a new task
 * POST /api/tasks
 */
export const createTask = async (req: Request, res: Response): Promise<Response> => {
  try {
  
    
    const { title, description, priority, dueDate, category } = req.body;
    
  
    
    // Validate required fields
    if (!title || !description || !priority || !dueDate) {
      const missingFields = [];
      if (!title) missingFields.push('title');
      if (!description) missingFields.push('description');
      if (!priority) missingFields.push('priority');
      if (!dueDate) missingFields.push('dueDate');
      

      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missing: missingFields
      } as ApiResponse);
    }
    
    // Verify user is authenticated and has a valid ID
    const userIdStr = (req as any).user?.id;
    if (!userIdStr) {
      console.error('❌ No user ID found in request');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      } as ApiResponse);
    }
    
    let userId;
    try {
      userId = new mongoose.Types.ObjectId(userIdStr);

    } catch (error) {
      console.error('❌ Invalid user ID format:', userIdStr);
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      } as ApiResponse);
    }

    const taskData = {
      title,
      description,
      priority,
      status: 'pending',
      dueDate: new Date(dueDate),
      category,
      userId,
    };


    
    // Create task with explicit validation
    const task = new Task(taskData);
    
    // Manually validate the task before saving
    const validationError = task.validateSync();
    if (validationError) {
      console.error('❌ Task validation error:', validationError);
      const errors: Record<string, string> = {};
      
      if (validationError.errors) {
        Object.keys(validationError.errors).forEach((key) => {
          errors[key] = validationError.errors[key].message;
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Task validation failed',
        errors: errors
      } as ApiResponse);
    }

 
    const savedTask = await task.save();

    
    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: savedTask,
    } as ApiResponse);
  } catch (error) {
    const err = error as Error;
    console.error('❌ Failed to create task:', {
      message: err.message,
      name: err.name,
      stack: err.stack,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: err.message,
      errorType: err.name
    } as ApiResponse);
  }
};

/**
 * Get all tasks for the authenticated user with smart sorting
 * GET /api/tasks
 */
export const getTasks = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId((req as any).user?.userId);
    const { 
      status, 
      priority, 
      category, 
      sortBy = 'smart',
      page = 1, 
      limit = 20 
    } = req.query;

    // Build filter object
    const filters: any = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (category) filters.category = category;

    let tasks;

    if (sortBy === 'smart') {
      // Use smart sorting algorithm from Task model
      tasks = await (Task as any).getSmartSortedTasks(userId, filters);
    } else {
      // Standard sorting options
      const sortOptions: any = {};
      switch (sortBy) {
        case 'dueDate':
          sortOptions.dueDate = 1;
          break;
        case 'priority':
          sortOptions.priority = -1;
          break;
        case 'created':
          sortOptions.createdAt = -1;
          break;
        default:
          sortOptions.createdAt = -1;
      }

      tasks = await Task.find({ userId, ...filters })
        .sort(sortOptions)
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));
    }

    // Get total count for pagination
    const totalTasks = await Task.countDocuments({ userId, ...filters });

    res.json({
      success: true,
      message: 'Tasks retrieved successfully',
      data: {
        tasks,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalTasks / Number(limit)),
          totalTasks,
          hasNext: Number(page) * Number(limit) < totalTasks,
          hasPrev: Number(page) > 1
        }
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tasks',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    } as ApiResponse);
  }
};

/**
 * Get a single task by ID
 * GET /api/tasks/:id
 */
export const getTaskById = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId((req as any).user?.userId);
    const { id } = req.params;

    const task = await Task.findOne({ _id: id, userId });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      } as ApiResponse);
    }

    res.json({
      success: true,
      message: 'Task retrieved successfully',
      data: { task }
    } as ApiResponse);

  } catch (error) {
    console.error('Get task by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve task',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    } as ApiResponse);
  }
};

/**
 * Update a task
 * PUT /api/tasks/:id
 */
export const updateTask = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId((req as any).user?.userId);
    const { id } = req.params;
    const updateData = req.body;

    // Convert date strings to Date objects if present
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }

    const task = await Task.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      } as ApiResponse);
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: { task }
    } as ApiResponse);

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    } as ApiResponse);
  }
};

/**
 * Mark task as completed
 * PATCH /api/tasks/:id/complete
 */
export const completeTask = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId((req as any).user?.userId);
    const { id } = req.params;

    const task = await Task.findOneAndUpdate(
      { _id: id, userId },
      { status: TaskStatus.COMPLETED },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      } as ApiResponse);
    }

    res.json({
      success: true,
      message: 'Task marked as completed',
      data: { task }
    } as ApiResponse);

  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete task',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    } as ApiResponse);
  }
};

/**
 * Delete a task
 * DELETE /api/tasks/:id
 */
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId((req as any).user?.userId);
    const { id } = req.params;

    const task = await Task.findOneAndDelete({ _id: id, userId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      } as ApiResponse);
    }

    res.json({
      success: true,
      message: 'Task deleted successfully',
      data: { deletedTask: task }
    } as ApiResponse);

  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    } as ApiResponse);
  }
};

/**
 * Get task statistics for dashboard
 * GET /api/tasks/stats
 */
export const getTaskStats = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId((req as any).user?.userId);

    const stats = await Task.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', TaskStatus.COMPLETED] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', TaskStatus.PENDING] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', TaskStatus.IN_PROGRESS] }, 1, 0] }
          },
          highPriority: {
            $sum: { $cond: [{ $eq: ['$priority', TaskPriority.HIGH] }, 1, 0] }
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$dueDate', new Date()] },
                    { $ne: ['$status', TaskStatus.COMPLETED] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const taskStats = stats[0] || {
      total: 0,
      completed: 0,
      pending: 0,
      inProgress: 0,
      highPriority: 0,
      overdue: 0
    };

    res.json({
      success: true,
      message: 'Task statistics retrieved successfully',
      data: { stats: taskStats }
    } as ApiResponse);

  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve task statistics',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    } as ApiResponse);
  }
};
