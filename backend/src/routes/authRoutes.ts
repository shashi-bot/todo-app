import { Router } from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateRegister, validateLogin, handleValidationErrors } from '../middleware/validation';

const router = Router();

/**
 * Authentication Routes
 * Base path: /api/auth
 */

// Public routes (no authentication required)
router.post('/register', validateRegister, handleValidationErrors, register);
router.post('/login', validateLogin, handleValidationErrors, login);

// Protected routes (authentication required)
router.get('/profile', authenticateToken as any, getProfile);
router.put('/profile', authenticateToken as any, updateProfile);

export default router;
