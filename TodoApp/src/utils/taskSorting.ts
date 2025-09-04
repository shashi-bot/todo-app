import { Task, TaskPriority, TaskStatus } from '../types';

/**
 * Local task sorting utility - mirrors backend smart sorting algorithm
 * Ensures app works offline with same sorting logic
 */

/**
 * Calculate priority score for sorting
 */
const getPriorityScore = (priority: TaskPriority): number => {
  switch (priority) {
    case TaskPriority.HIGH: return 3;
    case TaskPriority.MEDIUM: return 2;
    case TaskPriority.LOW: return 1;
    default: return 1;
  }
};

/**
 * Calculate urgency score based on due date proximity
 */
const getUrgencyScore = (dueDate: string): number => {
  const now = new Date();
  const due = new Date(dueDate);
  const diffInDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 0) return 10; // Overdue - highest urgency
  if (diffInDays === 0) return 8; // Due today
  if (diffInDays === 1) return 6; // Due tomorrow
  if (diffInDays <= 3) return 4; // Due within 3 days
  if (diffInDays <= 7) return 2; // Due within a week
  return 1; // Due later
};

/**
 * Calculate recency score based on creation time
 */
const getRecencyScore = (createdAt: string): number => {
  const now = new Date();
  const created = new Date(createdAt);
  const diffInHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours <= 1) return 5; // Created within last hour
  if (diffInHours <= 24) return 3; // Created today
  if (diffInHours <= 72) return 2; // Created within 3 days
  return 1; // Older tasks
};

/**
 * Smart sort tasks using the same algorithm as backend
 */
export const smartSortTasks = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => {
    // Skip completed tasks in smart sorting
    if (a.status === TaskStatus.COMPLETED && b.status !== TaskStatus.COMPLETED) return 1;
    if (b.status === TaskStatus.COMPLETED && a.status !== TaskStatus.COMPLETED) return -1;
    if (a.status === TaskStatus.COMPLETED && b.status === TaskStatus.COMPLETED) {
      // Sort completed tasks by completion date (most recent first)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }

    // Calculate composite scores for non-completed tasks
    const scoreA = (getPriorityScore(a.priority) * 0.4) + 
                   (getUrgencyScore(a.dueDate) * 0.5) + 
                   (getRecencyScore(a.createdAt) * 0.1);
                   
    const scoreB = (getPriorityScore(b.priority) * 0.4) + 
                   (getUrgencyScore(b.dueDate) * 0.5) + 
                   (getRecencyScore(b.createdAt) * 0.1);

    return scoreB - scoreA; // Higher score first
  });
};

/**
 * Filter tasks by status
 */
export const filterTasksByStatus = (tasks: Task[], status?: TaskStatus): Task[] => {
  if (!status) return tasks;
  return tasks.filter(task => task.status === status);
};

/**
 * Filter tasks by priority
 */
export const filterTasksByPriority = (tasks: Task[], priority?: TaskPriority): Task[] => {
  if (!priority) return tasks;
  return tasks.filter(task => task.priority === priority);
};

/**
 * Search tasks by title or description
 */
export const searchTasks = (tasks: Task[], query: string): Task[] => {
  if (!query.trim()) return tasks;
  
  const lowercaseQuery = query.toLowerCase();
  return tasks.filter(task => 
    task.title.toLowerCase().includes(lowercaseQuery) ||
    task.description.toLowerCase().includes(lowercaseQuery)
  );
};
