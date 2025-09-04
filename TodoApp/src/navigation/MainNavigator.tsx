import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import TaskListScreen from '../screens/tasks/TaskListScreen';
import CreateTaskScreen from '../screens/tasks/CreateTaskScreen';
import EditTaskScreen from '../screens/tasks/EditTaskScreen';
import TaskDetailScreen from '../screens/tasks/TaskDetailScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

/**
 * Task Stack Navigator
 * Handles task-related screens navigation
 */
const TaskStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
      {...({} as any)}
    >
      <Stack.Screen 
        name="TaskList" 
        component={TaskListScreen}
        options={{ title: 'My Tasks' }}
        {...({} as any)}
      />
      <Stack.Screen 
        name="CreateTask" 
        component={CreateTaskScreen}
        options={{ title: 'Create Task' }}
        {...({} as any)}
      />
      <Stack.Screen 
        name="EditTask" 
        component={EditTaskScreen}
        options={{ title: 'Edit Task' }}
        {...({} as any)}
      />
      <Stack.Screen 
        name="TaskDetail" 
        component={TaskDetailScreen}
        options={{ title: 'Task Details' }}
        {...({} as any)}
      />
    </Stack.Navigator>
  );
};

/**
 * Profile Stack Navigator
 * Handles profile-related screens
 */
const ProfileStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
      {...({} as any)}
    >
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
        {...({} as any)}
      />
    </Stack.Navigator>
  );
};

/**
 * Dashboard Stack Navigator
 * Handles dashboard and statistics screens
 */
const DashboardStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
      {...({} as any)}
    >
      <Stack.Screen 
        name="DashboardMain" 
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
        {...({} as any)}
      />
    </Stack.Navigator>
  );
};

/**
 * Main Tab Navigator
 * Bottom tab navigation for authenticated users
 */
const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'stats-chart' : 'stats-chart-outline';
              break;
            case 'Tasks':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
      {...({} as any)}
    >
      <Tab.Screen name="Dashboard" component={DashboardStackNavigator} {...({} as any)} />
      <Tab.Screen name="Tasks" component={TaskStackNavigator} {...({} as any)} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} {...({} as any)} />
    </Tab.Navigator>
  );
};

export default MainNavigator;
