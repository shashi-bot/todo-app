import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator} from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { loadUserFromStorage } from '../store/slices/authSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { AuthState } from '../types';

const Stack = createStackNavigator();

/**
 * Main App Navigator
 * Handles navigation between authenticated and unauthenticated flows
 */
const AppNavigator: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth as AuthState);

  useEffect(() => {
 
    dispatch(loadUserFromStorage());
  
  }, [dispatch]);

  if (isLoading) {
    return <LoadingSpinner text="Loading..." />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} {...({} as any)}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} {...({} as any)} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} {...({} as any)} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
