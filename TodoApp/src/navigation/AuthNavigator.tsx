import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

const Stack = createStackNavigator();

/**
 * Authentication Navigator
 * Handles navigation between login and register screens
 */
const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#f8f9fa' },
      }}
      {...({} as any)}
    >
      <Stack.Screen name="Login" component={LoginScreen} {...({} as any)} />
      <Stack.Screen name="Register" component={RegisterScreen} {...({} as any)} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
