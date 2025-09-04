import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootState, AppDispatch } from '../../store/store';
import { fetchTasks, updateFilters, completeTask, deleteTask } from '../../store/slices/taskSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';

import { TaskState, Task, TaskStatus, TaskPriority, RootStackParamList } from '../../types';

/**
 * Task List Screen Component
 * Displays all tasks with filtering and sorting options
 */
const TaskListScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { tasks, isLoading, filters } = useSelector((state: RootState) => state.tasks as TaskState);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [filters]);

  const loadTasks = () => {
    dispatch(fetchTasks(filters));
  };

  const handleRefresh = () => {
    loadTasks();
  };

  const handleCreateTask = () => {
    navigation.navigate('CreateTask' as never);
  };

  const handleTaskPress = (task: Task) => {
    navigation.navigate('TaskDetail', { taskId: task._id });
  };

  const handleCompleteTask = (taskId: string) => {
    dispatch(completeTask(taskId));
  };

  const handleDeleteTask = (taskId: string, title: string) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => dispatch(deleteTask(taskId))
        }
      ]
    );
  };

  const handleEditTask = (taskId: string) => {
    navigation.navigate('EditTask', { taskId });
  };

  const updateSortBy = (sortBy: string) => {
    dispatch(updateFilters({ sortBy: sortBy as any }));
  };

  const updateStatusFilter = (status?: TaskStatus) => {
    dispatch(updateFilters({ status }));
  };

  // const updatePriorityFilter = (priority?: TaskPriority) => {
  //   dispatch(updateFilters({ priority }));
  // };

  const renderTaskItem = ({ item }: { item: Task }) => (
    <TaskItem
      task={item}
      onPress={() => handleTaskPress(item)}
      onComplete={() => handleCompleteTask(item._id)}
      onDelete={() => handleDeleteTask(item._id, item.title)}
      onEdit={() => handleEditTask(item._id)}
    />
  );

  if (isLoading && tasks.length === 0) {
    return <LoadingSpinner text="Loading tasks..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header with filters and create button */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>My Tasks ({tasks.length})</Text>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Icon name="filter" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={styles.filtersContainer}>
            <Text style={styles.filterTitle}>Sort by:</Text>
            <View style={styles.filterRow}>
              {['smart', 'dueDate', 'priority', 'created'].map((sort) => (
                <TouchableOpacity
                  key={sort}
                  style={[
                    styles.filterChip,
                    filters.sortBy === sort && styles.filterChipActive
                  ]}
                  onPress={() => updateSortBy(sort)}
                >
                  <Text style={[
                    styles.filterChipText,
                    filters.sortBy === sort && styles.filterChipTextActive
                  ]}>
                    {sort === 'smart' ? 'Smart' : 
                     sort === 'dueDate' ? 'Due Date' :
                     sort === 'priority' ? 'Priority' : 'Created'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterTitle}>Status:</Text>
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  !filters.status && styles.filterChipActive
                ]}
                onPress={() => updateStatusFilter(undefined)}
              >
                <Text style={[
                  styles.filterChipText,
                  !filters.status && styles.filterChipTextActive
                ]}>All</Text>
              </TouchableOpacity>
              {Object.values(TaskStatus).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterChip,
                    filters.status === status && styles.filterChipActive
                  ]}
                  onPress={() => updateStatusFilter(status)}
                >
                  <Text style={[
                    styles.filterChipText,
                    filters.status === status && styles.filterChipTextActive
                  ]}>
                    {status.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Task List */}
      <FlatList
        data={tasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="checkmark-circle-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No tasks found</Text>
            <Text style={styles.emptySubtitle}>
              Create your first task to get started
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleCreateTask}>
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

/**
 * Individual Task Item Component
 */
interface TaskItemProps {
  task: Task;
  onPress: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onPress, 
  onComplete, 
  onDelete, 
  onEdit 
}) => {
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

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED: return 'checkmark-circle';
      case TaskStatus.IN_PROGRESS: return 'time';
      case TaskStatus.PENDING: return 'ellipse-outline';
      default: return 'ellipse-outline';
    }
  };

  return (
    <TouchableOpacity style={styles.taskItem} onPress={onPress}>
      <View style={styles.taskHeader}>
        <View style={styles.taskTitleRow}>
          <View style={[
            styles.priorityIndicator, 
            { backgroundColor: getPriorityColor(task.priority) }
          ]} />
          <Text style={[
            styles.taskTitle,
            isCompleted && styles.taskTitleCompleted
          ]}>
            {task.title}
          </Text>
          <Icon 
            name={getStatusIcon(task.status)} 
            size={20} 
            color={isCompleted ? '#28a745' : '#6c757d'} 
          />
        </View>
        
        <Text style={styles.taskDescription} numberOfLines={2}>
          {task.description}
        </Text>

        <View style={styles.taskMeta}>
          <Text style={[
            styles.taskDeadline,
            isOverdue && styles.taskOverdue
          ]}>
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </Text>
          <Text style={styles.taskPriority}>
            {task.priority?.toUpperCase() || 'MEDIUM'}
          </Text>
        </View>

        {task.category && (
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryText}>{task.category}</Text>
          </View>
        )}
      </View>

      <View style={styles.taskActions}>
        {!isCompleted && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onComplete}
          >
            <Icon name="checkmark" size={18} color="#28a745" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onEdit}
        >
          <Icon name="create-outline" size={18} color="#007AFF" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onDelete}
        >
          <Icon name="trash-outline" size={18} color="#dc3545" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    padding: 8,
  },
  filtersContainer: {
    paddingBottom: 16,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 8,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  taskItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskHeader: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 12,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#6c757d',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginLeft: 16,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 16,
  },
  taskDeadline: {
    fontSize: 12,
    color: '#666',
  },
  taskOverdue: {
    color: '#dc3545',
    fontWeight: '600',
  },
  taskPriority: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  categoryContainer: {
    marginTop: 8,
    marginLeft: 16,
  },
  categoryText: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingLeft: 8,
    minWidth: 120,
  },
  actionButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default TaskListScreen;
