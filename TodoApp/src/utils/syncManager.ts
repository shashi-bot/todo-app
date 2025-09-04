
import NetInfo from '@react-native-community/netinfo';


import { processOfflineQueue } from './offlineQueue';

/**
 * Background sync manager for offline-first architecture
 * Handles periodic syncing when app comes online
 */

let syncInterval: NodeJS.Timeout | null = null;
let isOnline = false;

/**
 * Initialize sync manager
 */
export const initializeSyncManager = () => {
  // Listen for network state changes
  const unsubscribe = NetInfo.addEventListener(state => {
    const wasOffline = !isOnline;
    isOnline = state.isConnected ?? false;
    
   
    
    if (isOnline && wasOffline) {
      // Just came online - sync immediately
     
      performSync();
    }
    
    // Start/stop periodic sync based on connection
    if (isOnline) {
      startPeriodicSync();
    } else {
      stopPeriodicSync();
    }
  });

  return unsubscribe;
};

/**
 * Start periodic background sync (every 5 minutes when online)
 */
const startPeriodicSync = () => {
  if (syncInterval) return; // Already running
  
  syncInterval = setInterval(() => {
    if (isOnline) {
      performSync();
    }
  }, 5 * 60 * 1000); // 5 minutes
};

/**
 * Stop periodic sync
 */
const stopPeriodicSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
};

/**
 * Perform background sync when online
 */
const performSync = async () => {
  if (!isOnline) return;
  
  try {

    
    // First, process any pending offline operations
    await processOfflineQueue();
    
    // DON'T fetch fresh data immediately after sync to avoid overriding offline tasks
    // Let the app naturally refresh when user navigates or pulls to refresh
  
  } catch (error) {
    console.error(' Background sync failed:', error);
  }
};

/**
 * Calculate stats from tasks array
 */
const calculateStatsFromTasks = (tasks: any[]) => {
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
    if (task.status === 'completed') {
      stats.completed++;
    } else if (task.status === 'in_progress') {
      stats.inProgress++;
    } else {
      stats.pending++;
    }

    if (task.priority === 'high') {
      stats.highPriority++;
    }

    if (new Date(task.dueDate) < now && task.status !== 'completed') {
      stats.overdue++;
    }
  });

  return stats;
};

/**
 * Force sync now (for manual refresh)
 */
export const forceSyncNow = () => {
  if (isOnline) {
    performSync();
  }
};

/**
 * Cleanup sync manager
 */
export const cleanupSyncManager = () => {
  stopPeriodicSync();
};
