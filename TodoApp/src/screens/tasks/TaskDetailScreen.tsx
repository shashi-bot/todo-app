import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootState, AppDispatch } from '../../store/store';
import { fetchTasks, completeTask, deleteTask } from '../../store/slices/taskSlice';
import { taskAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import { TaskState, Task, TaskStatus, TaskPriority, RootStackParamList } from '../../types';

/**
 * Task Detail Screen Component
 * Displays detailed view of a single task
 */
const TaskDetailScreen: React.FC = () => {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'TaskDetail'>>();
  const { taskId } = route.params;
  const { isLoading } = useSelector((state: RootState) => state.tasks as TaskState);

  useEffect(() => {
    loadTask();
  }, [taskId]);

  /**
   * Load task details
   */
  const loadTask = async () => {
    try {
      setLoading(true);
      const result = await taskAPI.getTaskById(taskId);
      
      if (result.success && result.data.task) {
        setTask(result.data.task);
      } else {
        Alert.alert('Error', 'Failed to load task details');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load task details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = () => {
    if (task) {
      dispatch(completeTask(task._id));
      setTask({ ...task, status: TaskStatus.COMPLETED, completedAt: new Date().toISOString() });
    }
  };

  const handleDeleteTask = () => {
    if (task) {
      Alert.alert(
        'Delete Task',
        `Are you sure you want to delete "${task.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: () => {
              dispatch(deleteTask(task._id));
              navigation.goBack();
            }
          }
        ]
      );
    }
  };

  const handleEditTask = () => {
    if (task) {
      navigation.navigate('EditTask', { taskId: task._id });
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading task details..." />;
  }

  if (!task) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={64} color="#dc3545" />
        <Text style={styles.errorTitle}>Task Not Found</Text>
        <Text style={styles.errorSubtitle}>The task you're looking for doesn't exist.</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== TaskStatus.COMPLETED;
  const isCompleted = task.status === TaskStatus.COMPLETED;

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH: return '#dc3545';
      case TaskPriority.MEDIUM: return '#ffc107';
      case TaskPriority.LOW: return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED: return '#28a745';
      case TaskStatus.IN_PROGRESS: return '#007AFF';
      case TaskStatus.PENDING: return '#6c757d';
      default: return '#6c757d';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[
            styles.priorityIndicator, 
            { backgroundColor: getPriorityColor(task.priority) }
          ]} />
          <Text style={[
            styles.title,
            isCompleted && styles.titleCompleted
          ]}>
            {task.title}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(task.status) }
          ]}>
            <Text style={styles.statusText}>
              {task.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          
          <View style={[
            styles.priorityBadge,
            { backgroundColor: getPriorityColor(task.priority) }
          ]}>
            <Text style={styles.priorityText}>
              {task.priority.toUpperCase()} PRIORITY
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{task.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.dateRow}>
            <Icon name="calendar-outline" size={20} color={isOverdue ? '#dc3545' : '#666'} />
            <View style={styles.dateInfo}>
              <Text style={styles.dateLabel}>Due Date</Text>
              <Text style={[
                styles.dateValue,
                isOverdue && styles.overdueText
              ]}>
                {new Date(task.dueDate).toLocaleDateString()}
                {isOverdue && ' (Overdue)'}
              </Text>
            </View>
          </View>

          {task.completedAt && (
            <View style={styles.dateRow}>
              <Icon name="checkmark-circle-outline" size={20} color="#28a745" />
              <View style={styles.dateInfo}>
                <Text style={styles.dateLabel}>Completed</Text>
                <Text style={styles.dateValue}>
                  {new Date(task.completedAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}
        </View>

        {task.category && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryText}>{task.category}</Text>
            </View>
          </View>
        )}


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Created</Text>
          <Text style={styles.createdText}>
            {new Date(task.createdAt).toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {!isCompleted && (
          <Button
            title="Mark Complete"
            onPress={handleCompleteTask}
            style={styles.completeButton}
            disabled={isLoading}
          />
        )}
        
        <Button
          title="Edit Task"
          onPress={handleEditTask}
          variant="secondary"
          style={styles.editButton}
        />
        
        <Button
          title="Delete Task"
          onPress={handleDeleteTask}
          variant="danger"
          style={styles.deleteButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  priorityIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 16,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#6c757d',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateInfo: {
    marginLeft: 12,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  overdueText: {
    color: '#dc3545',
    fontWeight: '600',
  },
  categoryContainer: {
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 14,
    color: '#007AFF',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  createdText: {
    fontSize: 16,
    color: '#666',
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  completeButton: {
    backgroundColor: '#28a745',
  },
  editButton: {
    marginBottom: 0,
  },
  deleteButton: {
    marginBottom: 0,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
});

export default TaskDetailScreen;
