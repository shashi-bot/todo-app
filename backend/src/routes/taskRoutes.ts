import { Router } from 'express';
import { 
  createTask, 
  getTasks, 
  getTaskById, 
  updateTask, 
  completeTask, 
  deleteTask, 
  getTaskStats 
} from '../controllers/taskController';
import { authenticateToken } from '../middleware/auth';
import { validateTask, handleValidationErrors } from '../middleware/validation';

const router = Router();

/**
 * Task Routes
 * Base path: /api/tasks
 * All routes require authentication
 */

// Apply authentication middleware to all routes
router.use(authenticateToken as any);

// Task statistics (must come before /:id routes)
router.get('/stats', getTaskStats);

// CRUD operations for tasks
router.post('/', validateTask, handleValidationErrors, createTask);
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.put('/:id', validateTask, handleValidationErrors, updateTask);
router.delete('/:id', deleteTask);

// Special task operations
router.patch('/:id/complete', completeTask);

export default router;
