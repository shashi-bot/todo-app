import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, TaskForm, TaskState, TaskStats, TaskStatus, TaskPriority, TaskFilters } from '../../types';
import { taskAPI } from '../../services/api';
import { smartSortTasks } from '../../utils/taskSorting';
import { createTaskOffline, updateTaskOffline, deleteTaskOffline } from '../../utils/offlineQueue';

/**
 * Initial state for tasks
 */
const initialState: TaskState = {
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,
  filters: {
    sortBy: 'smart',
  },
  stats: {
    total: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    highPriority: 0,
    overdue: 0,
  },
};

/**
 * Async thunk to fetch all tasks
 */
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (filters: Partial<TaskFilters> = {}, { rejectWithValue }) => {
    try {
      const result = await taskAPI.getTasks(filters);
      
      if (!result.success) {
        return rejectWithValue(result.message);
      }

      // Cache tasks locally for offline access
      const sortedTasks = smartSortTasks(result.data.tasks);
      await AsyncStorage.setItem('cachedTasks', JSON.stringify(sortedTasks));

      return sortedTasks;
    } catch (error: any) {
      // Try to load from cache if network fails
      try {
        const cachedTasks = await AsyncStorage.getItem('cachedTasks');
        if (cachedTasks) {
          const tasks = JSON.parse(cachedTasks);
          return smartSortTasks(tasks); // Apply local sorting to cached tasks
        }
      } catch (cacheError) {

      }
      
      return rejectWithValue(error.message || 'Failed to fetch tasks');
    }
  }
);

/**
 * Async thunk to create a new task with offline support
 */
export const createTask = createAsyncThunk(
  'tasks/create',
  async (taskData: TaskForm, { rejectWithValue }) => {
    try {
      const response = await taskAPI.createTask(taskData);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    } catch (error: any) {

      
      // Check for network-related errors
      const isNetworkError = 
        error.code === 'NETWORK_ERROR' || 
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.message?.includes('Network Error') ||
        error.message?.includes('timeout') ||
        !error.response;
      
      if (isNetworkError) {

        try {
          const offlineTask = await createTaskOffline(taskData);
          return offlineTask;
        } catch (offlineError) {
    
          return rejectWithValue('Failed to create task offline');
        }
      }
      
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create task');
    }
  }
);

/**
 * Async thunk to update a task with offline support
 */
export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, updates }: { id: string; updates: Partial<TaskForm> }, { rejectWithValue }) => {
    try {
      const response = await taskAPI.updateTask(id, updates);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    } catch (error: any) {
  
      
      // Check for network-related errors
      const isNetworkError = 
        error.code === 'NETWORK_ERROR' || 
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.message?.includes('Network Error') ||
        error.message?.includes('timeout') ||
        !error.response;
      
      if (isNetworkError) {

        try {
          const offlineTask = await updateTaskOffline(id, updates);
          return offlineTask;
        } catch (offlineError) {
      
          return rejectWithValue('Failed to update task offline');
        }
      }
      
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update task');
    }
  }
);

/**
 * Async thunk to complete a task
 */
export const completeTask = createAsyncThunk(
  'tasks/completeTask',
  async (taskId: string, { rejectWithValue }) => {
    try {
      const result = await taskAPI.completeTask(taskId);
      
      if (!result.success) {
        return rejectWithValue(result.message);
      }

      return result.data.task;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to complete task');
    }
  }
);

/**
 * Async thunk to delete a task with offline support
 */
export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId: string, { rejectWithValue }) => {
    try {
      const response = await taskAPI.deleteTask(taskId);
      if (!response.success) {
        throw new Error(response.message);
      }
      return taskId;
    } catch (error: any) {
  
      
      // Check for network-related errors
      const isNetworkError = 
        error.code === 'NETWORK_ERROR' || 
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.message?.includes('Network Error') ||
        error.message?.includes('timeout') ||
        !error.response;
      
      if (isNetworkError) {
    
        try {
          await deleteTaskOffline(taskId);
          return taskId;
        } catch (offlineError) {
    
          return rejectWithValue('Failed to delete task offline');
        }
      }
      
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete task');
    }
  }
);

/**
 * Async thunk to fetch task statistics
 */
export const fetchTaskStats = createAsyncThunk(
  'tasks/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const result = await taskAPI.getTaskStats();
      
      if (!result.success) {
        return rejectWithValue(result.message);
      }

      return result.data.stats;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch task statistics');
    }
  }
);

/**
 * Helper function to calculate task statistics
 */
const calculateStats = (tasks: Task[]): TaskStats => {
  const stats = {
    total: tasks.length,
    completed: 0,
    pending: 0,
    inProgress: 0,
    highPriority: 0,
    overdue: 0,
  };

  const now = new Date();
  
  tasks.forEach(task => {
    if (task.status === TaskStatus.COMPLETED) {
      stats.completed++;
    } else if (task.status === TaskStatus.IN_PROGRESS) {
      stats.inProgress++;
    } else {
      stats.pending++;
    }
    
    if (task.priority === TaskPriority.HIGH) {
      stats.highPriority++;
    }
    
    if (task.status !== TaskStatus.COMPLETED && new Date(task.dueDate) < now) {
      stats.overdue++;
    }
  });
  
  return stats;
};

/**
 * Task slice with reducers and actions
 */
const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentTask: (state, action: PayloadAction<Task | null>) => {
      state.currentTask = action.payload;
    },
    updateFilters: (state, action: PayloadAction<Partial<TaskFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearTasks: (state) => {
      state.tasks = [];
      state.currentTask = null;
    },
    // Optimistic updates for better UX
    optimisticUpdateTask: (state, action: PayloadAction<{ id: string; updates: Partial<Task> }>) => {
      const { id, updates } = action.payload;
      const taskIndex = state.tasks.findIndex(task => task._id === id);
      if (taskIndex !== -1) {
        state.tasks[taskIndex] = { ...state.tasks[taskIndex], ...updates };
      }
      // Update stats immediately
      state.stats = calculateStats(state.tasks);
    },
    optimisticDeleteTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(task => task._id !== action.payload);
      // Update stats immediately
      state.stats = calculateStats(state.tasks);
    },
    optimisticAddTask: (state, action: PayloadAction<Task>) => {
      state.tasks.unshift(action.payload);
      // Update stats immediately
      state.stats = calculateStats(state.tasks);
    },
  },
  extraReducers: (builder) => {
    // Fetch tasks
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload;
        state.stats = calculateStats(action.payload);
        state.error = null;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create task
    builder
      .addCase(createTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks.unshift(action.payload); // Add to beginning of array
        state.stats = calculateStats(state.tasks);
        state.error = null;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update task
    builder
      .addCase(updateTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.isLoading = false;
        const taskIndex = state.tasks.findIndex(task => task._id === action.payload._id);
        if (taskIndex !== -1) {
          state.tasks[taskIndex] = action.payload;
        }
        if (state.currentTask && state.currentTask._id === action.payload._id) {
          state.currentTask = action.payload;
        }
        state.stats = calculateStats(state.tasks);
        state.error = null;
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Complete task
    builder
      .addCase(completeTask.pending, (state) => {
        state.error = null;
      })
      .addCase(completeTask.fulfilled, (state, action) => {
        const taskIndex = state.tasks.findIndex(task => task._id === action.payload._id);
        if (taskIndex !== -1) {
          state.tasks[taskIndex] = action.payload;
        }
        if (state.currentTask && state.currentTask._id === action.payload._id) {
          state.currentTask = action.payload;
        }
        state.stats = calculateStats(state.tasks);
        state.error = null;
      })
      .addCase(completeTask.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Delete task
    builder
      .addCase(deleteTask.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(task => task._id !== action.payload);
        if (state.currentTask && state.currentTask._id === action.payload) {
          state.currentTask = null;
        }
        state.stats = calculateStats(state.tasks);
        state.error = null;
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Fetch task stats
    builder
      .addCase(fetchTaskStats.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchTaskStats.fulfilled, (state, action) => {
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(fetchTaskStats.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setCurrentTask,
  updateFilters,
  clearTasks,
  optimisticUpdateTask,
  optimisticDeleteTask,
  optimisticAddTask,
} = taskSlice.actions;

export default taskSlice.reducer;
