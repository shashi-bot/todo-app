import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User, LoginForm, RegisterForm } from '../../types';
import { authAPI } from '../../services/api';

/**
 * Initial state for authentication
 */
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

/**
 * Async thunk for user registration
 * Uses backend API only for authentication
 */
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterForm, { rejectWithValue }) => {
    try {
      // Register with backend API
      const backendResult = await authAPI.register({
        name: userData.name,
        email: userData.email,
        password: userData.password,
      });

      if (!backendResult.success) {
        return rejectWithValue(backendResult.message);
      }

      // Store token in AsyncStorage
      await AsyncStorage.setItem('token', backendResult.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(backendResult.data.user));

      return {
        user: backendResult.data.user,
        token: backendResult.data.token,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

/**
 * Async thunk for user login
 * Uses backend API only for authentication
 */
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginForm, { rejectWithValue }) => {
    try {
 
      // Authenticate with backend API
      const backendResult = await authAPI.login(credentials);

      if (!backendResult.success) {
       
        return rejectWithValue(backendResult.message);
      }

      // Store token in AsyncStorage
      await AsyncStorage.setItem('token', backendResult.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(backendResult.data.user));


      return {
        user: backendResult.data.user,
        token: backendResult.data.token,
      };
    } catch (error: any) {
   
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

/**
 * Async thunk for user logout
 */
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
 

      await AsyncStorage.clear();
    
      return null;
    } catch (error: any) {

      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

/**
 * Async thunk to load user from storage on app start
 */
export const loadUserFromStorage = createAsyncThunk(
  'auth/loadFromStorage',
  async (_, { rejectWithValue }) => {
    try {

      const token = await AsyncStorage.getItem('token');
      const userString = await AsyncStorage.getItem('user');
      

      
      if (token && userString) {
        const user = JSON.parse(userString);
      
        return { user, token };
      }
      
    
      return null;
    } catch (error: any) {

      return rejectWithValue(error.message || 'Failed to load user from storage');
    }
  }
);

/**
 * Auth slice with reducers and actions
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Register user
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Login user
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Logout user
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Load user from storage
    builder
      .addCase(loadUserFromStorage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadUserFromStorage.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
        } else {
          // Clear state if no cached data
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(loadUserFromStorage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // Clear state on error
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, setLoading, updateUser } = authSlice.actions;
export default authSlice.reducer;
