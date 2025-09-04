import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState, AppDispatch } from '../../store/store';
import { fetchTaskStats, fetchTasks } from '../../store/slices/taskSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { TaskState, AuthState, Task, TaskStatus, TaskPriority, TaskStats } from '../../types';

const { width } = Dimensions.get('window');

/**
 * Calculate task statistics locally from cached tasks
 */
const calculateLocalStats = (tasks: Task[]): TaskStats => {
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

    if (new Date(task.dueDate) < now && task.status !== TaskStatus.COMPLETED) {
      stats.overdue++;
    }
  });

  return stats;
};

/**
 * Dashboard Screen Component
 * Displays task statistics and overview
 */
const DashboardScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { stats, isLoading } = useSelector((state: RootState) => state.tasks as TaskState);
  const { user } = useSelector((state: RootState) => state.auth as AuthState);

  useEffect(() => {
    // Load from cache first for instant display, then fetch fresh data
    const loadCachedData = async () => {
      try {
        const cachedTasks = await AsyncStorage.getItem('cachedTasks');
        
        
        if (cachedTasks) {
          // Load cached tasks immediately for faster UI
          const tasks = JSON.parse(cachedTasks);
          // Calculate stats from cached tasks for instant display
          const localStats = calculateLocalStats(tasks);
          // Cache the calculated stats
          await AsyncStorage.setItem('cachedStats', JSON.stringify(localStats));
        }
      } catch (error) {
        console.log('Cache load error:', error);
      }
    };

    loadCachedData();
    
    // Then fetch fresh data from backend
    dispatch(fetchTasks({}));
    dispatch(fetchTaskStats());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchTasks({}));
    dispatch(fetchTaskStats());
  };

  if (isLoading && stats.total === 0) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }


  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name}!</Text>
        <Text style={styles.subtitle}>Here's your task overview</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <StatCard
            title="Total Tasks"
            value={stats.total}
            color="#007AFF"
            iconName="list"
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            color="#28a745"
            iconName="checkmark-circle"
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            color="#ffc107"
            iconName="time"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            color="#6c757d"
            iconName="document-text"
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="High Priority"
            value={stats.highPriority}
            color="#dc3545"
            iconName="flame"
          />
          <StatCard
            title="Overdue"
            value={stats.overdue}
            color="#e74c3c"
            iconName="warning"
          />
        </View>
      </View>


      {stats.overdue > 0 && (
        <View style={styles.alertContainer}>
          <View style={styles.alertHeader}>
            <Icon name="warning" size={20} color="#856404" />
            <Text style={styles.alertTitle}>Attention Needed</Text>
          </View>
          <Text style={styles.alertText}>
            You have {stats.overdue} overdue task{stats.overdue > 1 ? 's' : ''}. 
            Consider reviewing and updating your deadlines.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

/**
 * Reusable Stat Card Component
 */
interface StatCardProps {
  title: string;
  value: number;
  color: string;
  iconName: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color, iconName }) => {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Icon name={iconName} size={20} color={color} style={styles.statIcon} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: (width - 48) / 2,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    marginRight: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  alertContainer: {
    backgroundColor: '#fff3cd',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginLeft: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});

export default DashboardScreen;
