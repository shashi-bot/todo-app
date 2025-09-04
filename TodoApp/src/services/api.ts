import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, LoginForm, RegisterForm, TaskForm, TaskFilters } from '../types';

/**
 * API Configuration
 * Base URL for the backend API - update this to match your backend server
 */
const BASE_URL = 'https://backendtodo-nf64.onrender.com/api';

/**
 * Create axios instance with base configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor to add authentication token
 */
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
       
      } else {

      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for error handling
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage and redirect to login
      await AsyncStorage.multiRemove(['token', 'user']);
      // You can dispatch a logout action here if needed
    }
    return Promise.reject(error);
  }
);

/**
 * Authentication API endpoints
 */
export const authAPI = {
  /**
   * Register a new user
   */
  register: async (userData: { name: string; email: string; password: string }): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
        error: error.message,
      };
    }
  },

  /**
   * Login user
   */
  login: async (credentials: LoginForm): Promise<ApiResponse> => {
    try {
   
      const response = await apiClient.post('/auth/login', credentials);
    
      return response.data;
    } catch (error: any) {

      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
        error: error.message,
      };
    }
  },

  /**
   * Get user profile
   */
  getProfile: async (): Promise<ApiResponse> => {
    try {
      const response = await apiClient.get('/auth/profile');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get profile',
        error: error.message,
      };
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (userData: { name: string }): Promise<ApiResponse> => {
    try {
      const response = await apiClient.put('/auth/profile', userData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile',
        error: error.message,
      };
    }
  },
};

/**
 * Task API endpoints
 */
export const taskAPI = {
  /**
   * Get all tasks with optional filters
   */
  getTasks: async (filters?: Partial<TaskFilters>): Promise<ApiResponse> => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);

      const response = await apiClient.get(`/tasks?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch tasks',
        error: error.message,
      };
    }
  },

  /**
   * Get a single task by ID
   */
  getTaskById: async (taskId: string): Promise<ApiResponse> => {
    try {
      const response = await apiClient.get(`/tasks/${taskId}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch task',
        error: error.message,
      };
    }
  },

  /**
   * Create a new task
   */
  createTask: async (taskData: TaskForm): Promise<ApiResponse> => {
    try {
     
      const payload = {
        ...taskData,
        dueDate: taskData.dueDate instanceof Date ? taskData.dueDate.toISOString() : new Date(taskData.dueDate).toISOString(),
      };
      
 
      const response = await apiClient.post('/tasks', payload);
   
      return response.data;
    } catch (error: any) {
     
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create task',
        error: error.message,
      };
    }
  },

  /**
   * Update a task
   */
  updateTask: async (taskId: string, updates: Partial<TaskForm>): Promise<ApiResponse> => {
    try {
      const updateData = { ...updates };
      if (updateData.dueDate) {
        updateData.dueDate = updateData.dueDate.toISOString() as any;
      }

      const response = await apiClient.put(`/tasks/${taskId}`, updateData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update task',
        error: error.message,
      };
    }
  },

  /**
   * Mark task as completed
   */
  completeTask: async (taskId: string): Promise<ApiResponse> => {
    try {
      const response = await apiClient.patch(`/tasks/${taskId}/complete`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to complete task',
        error: error.message,
      };
    }
  },

  /**
   * Delete a task
   */
  deleteTask: async (taskId: string): Promise<ApiResponse> => {
    try {
      const response = await apiClient.delete(`/tasks/${taskId}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete task',
        error: error.message,
      };
    }
  },

  /**
   * Get task statistics
   */
  getTaskStats: async (): Promise<ApiResponse> => {
    try {
      const response = await apiClient.get('/tasks/stats');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch task statistics',
        error: error.message,
      };
    }
  },
};

export default apiClient;
