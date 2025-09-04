import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootState, AppDispatch } from '../../store/store';
import { createTask } from '../../store/slices/taskSlice';
import { TaskPriority } from '../../types';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

/**
 * Create Task Screen Component
 * Form for creating new tasks with all required fields
 */
const CreateTaskScreen: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState(new Date());
  const [category, setCategory] = useState('');
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);

  // Form validation errors
  const [titleError, setTitleError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [dateError, setDateError] = useState('');

  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { isLoading } = useSelector((state: RootState) => state.tasks);

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    let isValid = true;
    
    // Reset errors
    setTitleError('');
    setDescriptionError('');
    setDateError('');

    // Title validation
    if (!title.trim()) {
      setTitleError('Title is required');
      isValid = false;
    } else if (title.trim().length > 100) {
      setTitleError('Title cannot exceed 100 characters');
      isValid = false;
    }

    // Description validation
    if (!description.trim()) {
      setDescriptionError('Description is required');
      isValid = false;
    } else if (description.trim().length > 500) {
      setDescriptionError('Description cannot exceed 500 characters');
      isValid = false;
    }

    // Date validation
    const now = new Date();
    if (dueDate < now) {
      setDateError('Due date cannot be in the past');
      isValid = false;
    }

    return isValid;
  };

  /**
   * Handle form submission
   */
  const handleCreateTask = async () => {
    if (!validateForm()) {
      return;
    }

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      priority,
      dueDate,
      category: category.trim() || 'General',
    };

    try {
      await dispatch(createTask(taskData)).unwrap();
      Alert.alert('Success', 'Task created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create task. Please try again.');
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Creating task..." />;
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          <Input
            label="Task Title *"
            value={title}
            onChangeText={setTitle}
            placeholder="Enter task title"
            error={titleError}
            maxLength={100}
          />

          <Input
            label="Description *"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your task"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            error={descriptionError}
            maxLength={500}
            style={styles.textArea}
          />

          {/* Priority Selection */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Priority *</Text>
            <View style={styles.priorityContainer}>
              {Object.values(TaskPriority).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityButton,
                    priority === p && styles.priorityButtonActive,
                    { borderColor: getPriorityColor(p) }
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={[
                    styles.priorityText,
                    priority === p && { color: getPriorityColor(p) }
                  ]}>
                    {p.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Due Date */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Due Date *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDueDatePicker(true)}
            >
              <Icon name="calendar-outline" size={20} color="#666" />
              <Text style={styles.dateText}>
                {dueDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>


          {dateError ? (
            <Text style={styles.errorText}>{dateError}</Text>
          ) : null}

          <Input
            label="Category"
            value={category}
            onChangeText={setCategory}
            placeholder="e.g., Work, Personal, Shopping"
            maxLength={30}
          />


          <View style={styles.buttonContainer}>
            <Button
              title="Create Task"
              onPress={handleCreateTask}
              style={styles.createButton}
            />
            
            <Button
              title="Cancel"
              onPress={() => navigation.goBack()}
              variant="secondary"
            />
          </View>
        </View>
      </ScrollView>

      {/* Date Pickers */}
      <DatePicker
        modal
        open={showDueDatePicker}
        date={dueDate}
        mode="date"
        minimumDate={new Date()}
        onConfirm={(date) => {
          setShowDueDatePicker(false);
          setDueDate(date);
        }}
        onCancel={() => setShowDueDatePicker(false)}
      />
    </KeyboardAvoidingView>
  );
};

/**
 * Get color for priority level
 */
const getPriorityColor = (priority: TaskPriority): string => {
  switch (priority) {
    case TaskPriority.HIGH: return '#dc3545';
    case TaskPriority.MEDIUM: return '#ffc107';
    case TaskPriority.LOW: return '#28a745';
    default: return '#6c757d';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  priorityButtonActive: {
    backgroundColor: '#f8f9fa',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  createButton: {
    marginBottom: 8,
  },
});

export default CreateTaskScreen;
