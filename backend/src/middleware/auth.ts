import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload, AuthenticatedRequest } from '../types';

/**
 * Authentication middleware to verify JWT tokens
 * Protects routes that require user authentication
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // Get token from Authorization header
  const authHeader = req.headers['authorization'] as string | undefined;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token is required'
    });
  }

  try {
    // Verify token
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';

    
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    
    // Ensure we have a valid userId
    if (!decoded.userId) {
   
      return res.status(403).json({
        success: false,
        message: 'Invalid token: Missing userId'
      });
    }
    

    
    // Add user info to request object
    (req as any).user = {
      id: decoded.userId,  
      userId: decoded.userId,
      email: decoded.email || ''
    };
    
  
    
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user info if token is present but doesn't fail if missing
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'] as string | undefined;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    (req as any).user = {
      userId: decoded.userId,
      email: decoded.email
    };
  } catch (error) {
    // Continue without user info if token is invalid
    console.log('Invalid token in optional auth:', error);
  }
  
  next();
};
