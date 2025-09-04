import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, TaskForm } from '../types';
import { taskAPI } from '../services/api';

/**
 * Offline queue manager for handling operations when offline
 * Stores pending operations and syncs them when back online
 */

export interface PendingOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: number;
}

const OFFLINE_QUEUE_KEY = 'offlineQueue';
const TEMP_TASKS_KEY = 'tempTasks';

/**
 * Add operation to offline queue
 */
export const addToOfflineQueue = async (operation: Omit<PendingOperation, 'id' | 'timestamp'>) => {
  try {
    const queue = await getOfflineQueue();
    const newOperation: PendingOperation = {
      ...operation,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    
    queue.push(newOperation);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    
  
  } catch (error) {
    console.error('Failed to add to offline queue:', error);
  }
};

/**
 * Get offline queue
 */
export const getOfflineQueue = async (): Promise<PendingOperation[]> => {
  try {
    const queueData = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return queueData ? JSON.parse(queueData) : [];
  } catch (error) {
    console.error('Failed to get offline queue:', error);
    return [];
  }
};

/**
 * Clear offline queue
 */
export const clearOfflineQueue = async () => {
  try {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (error) {
    console.error('Failed to clear offline queue:', error);
  }
};

/**
 * Create task offline - store locally and add to sync queue
 */
export const createTaskOffline = async (taskData: TaskForm): Promise<Task> => {
  try {
    // Generate temporary ID
    const tempId = `temp_${Date.now()}`;
    
    // Create task object with temp ID
    const newTask: Task = {
      _id: tempId,
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      status: 'pending' as any,
      dueDate: taskData.dueDate.toISOString(),
      category: taskData.category || 'General',
      userId: 'temp_user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };



    // Store in temporary tasks
    const tempTasks = await getTempTasks();
    tempTasks.push(newTask);
    await AsyncStorage.setItem(TEMP_TASKS_KEY, JSON.stringify(tempTasks));


    // Update cached tasks to include this new task
    const cachedTasks = await AsyncStorage.getItem('cachedTasks');
    const tasks = cachedTasks ? JSON.parse(cachedTasks) : [];
    tasks.unshift(newTask); // Add to beginning
    await AsyncStorage.setItem('cachedTasks', JSON.stringify(tasks));


    // Add to offline queue for sync with temp ID mapping
    await addToOfflineQueue({
      type: 'CREATE',
      data: { ...taskData, tempId }, // Include temp ID for mapping
    });


    return newTask;
  } catch (error) {
 
    throw error;
  }
};

/**
 * Update task offline
 */
export const updateTaskOffline = async (taskId: string, updates: Partial<TaskForm>): Promise<Task> => {
  try {
    // Update in cached tasks
    const cachedTasks = await AsyncStorage.getItem('cachedTasks');
    const tasks: Task[] = cachedTasks ? JSON.parse(cachedTasks) : [];
    
    const taskIndex = tasks.findIndex(t => t._id === taskId);
    if (taskIndex !== -1) {
      tasks[taskIndex] = {
        ...tasks[taskIndex],
        ...updates,
        dueDate: updates.dueDate ? updates.dueDate.toISOString() : tasks[taskIndex].dueDate,
        updatedAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem('cachedTasks', JSON.stringify(tasks));
      
      // Add to offline queue
      await addToOfflineQueue({
        type: 'UPDATE',
        data: { id: taskId, updates },
      });
      

      return tasks[taskIndex];
    }
    
    throw new Error('Task not found');
  } catch (error) {
    console.error('Failed to update task offline:', error);
    throw error;
  }
};

/**
 * Delete task offline
 */
export const deleteTaskOffline = async (taskId: string): Promise<void> => {
  try {
    // Remove from cached tasks
    const cachedTasks = await AsyncStorage.getItem('cachedTasks');
    const tasks: Task[] = cachedTasks ? JSON.parse(cachedTasks) : [];
    
    const filteredTasks = tasks.filter(t => t._id !== taskId);
    await AsyncStorage.setItem('cachedTasks', JSON.stringify(filteredTasks));
    
    // Add to offline queue
    await addToOfflineQueue({
      type: 'DELETE',
      data: { id: taskId },
    });
    
  
  } catch (error) {
    console.error('Failed to delete task offline:', error);
    throw error;
  }
};

/**
 * Get temporary tasks
 */
export const getTempTasks = async (): Promise<Task[]> => {
  try {
    const tempData = await AsyncStorage.getItem(TEMP_TASKS_KEY);
    return tempData ? JSON.parse(tempData) : [];
  } catch (error) {
    console.error('Failed to get temp tasks:', error);
    return [];
  }
};

/**
 * Clear temporary tasks
 */
export const clearTempTasks = async () => {
  try {
    await AsyncStorage.removeItem(TEMP_TASKS_KEY);
  } catch (error) {
    console.error('Failed to clear temp tasks:', error);
  }
};

/**
 * Process offline queue - sync pending operations
 */
export const processOfflineQueue = async (): Promise<void> => {
  try {

    const queue = await getOfflineQueue();

    
    if (queue.length === 0) {
 
      return;
    }

  

    const successfulOperations: string[] = [];
    const tempTaskMappings: { [tempId: string]: string } = {}; // Map temp IDs to real IDs

    for (const operation of queue) {
      try {
    
        
        switch (operation.type) {
          case 'CREATE':
            // Remove tempId from data before sending to API
            const { tempId, ...taskDataForAPI } = operation.data;
          
            
            const response = await taskAPI.createTask(taskDataForAPI);
      
            
            if (response.success) {
              successfulOperations.push(operation.id);
              
              // Map temp ID to real ID if available
              if (tempId && response.data?._id) {
                tempTaskMappings[tempId] = response.data._id;
             
              }
              
            
            } else {
              console.log(`CREATE failed:`, response.message);
            }
            break;
            
          case 'UPDATE':
            const updateResponse = await taskAPI.updateTask(operation.data.id, operation.data.updates);
            if (updateResponse.success) {
              successfulOperations.push(operation.id);
       
            } else {
              console.log(` UPDATE failed:`, updateResponse.message);
            }
            break;
            
          case 'DELETE':
            const deleteResponse = await taskAPI.deleteTask(operation.data.id);
            if (deleteResponse.success) {
              successfulOperations.push(operation.id);
    
            } else {
              console.log(`DELETE failed:`, deleteResponse.message);
            }
            break;
        }
      } catch (error) {
        console.error(`Failed to sync ${operation.type} operation:`, error);
        // Continue with other operations
      }
    }

    // Update cached tasks with real IDs
    if (Object.keys(tempTaskMappings).length > 0) {
      await updateCachedTasksWithRealIds(tempTaskMappings);
    }

    // Only clear successfully synced operations
    if (successfulOperations.length > 0) {
      const remainingQueue = queue.filter(op => !successfulOperations.includes(op.id));
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
      

      
      // Only clear temp tasks if all operations were successful
      if (remainingQueue.length === 0) {
        await clearTempTasks();
      
      } else {
        console.log(` ${remainingQueue.length} operations still pending - keeping temp tasks`);
      }
    } else {
      console.log('No operations were successfully synced');
    }
  } catch (error) {
    console.error('Failed to process offline queue:', error);
  }
};

/**
 * Update cached tasks with real IDs from server
 */
const updateCachedTasksWithRealIds = async (mappings: { [tempId: string]: string }) => {
  try {
    const cachedTasks = await AsyncStorage.getItem('cachedTasks');
    if (!cachedTasks) return;
    
    const tasks = JSON.parse(cachedTasks);
    let updated = false;
    
    tasks.forEach((task: any) => {
      if (mappings[task._id]) {
        
        task._id = mappings[task._id];
        updated = true;
      }
    });
    
    if (updated) {
      await AsyncStorage.setItem('cachedTasks', JSON.stringify(tasks));
     
    }
  } catch (error) {
    console.error('Failed to update cached tasks with real IDs:', error);
  }
};
