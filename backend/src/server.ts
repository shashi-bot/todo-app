import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import Database from './config/database';
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';

// Load environment variables
dotenv.config();

/**
 * Express server setup with comprehensive middleware and security
 */
class Server {
  public app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000');
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize middleware stack
   */
  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Compression middleware
    this.app.use(compression());

    // Logging middleware
    this.app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
    
    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Custom request logging middleware (after body parsing)
    this.app.use((req, res, next) => {
      console.log(' MIDDLEWARE HIT - REQUEST RECEIVED');
      console.log(` ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
      console.log(' Headers:', req.headers);
      if (req.body && Object.keys(req.body).length > 0) {
        console.log(' Body:', req.body);
      }
      console.log('END REQUEST LOG');
      next();
    });

    // Request timeout middleware
    this.app.use((req, res, next) => {
      res.setTimeout(30000, () => {
        res.status(408).json({
          success: false,
          message: 'Request timeout'
        });
      });
      next();
    });
  }

  /**
   * Initialize API routes
   */
  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/tasks', taskRoutes);

    // 404 handler for undefined routes
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
      });
    });
  }

  /**
   * Initialize error handling middleware
   */
  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Global error handler:', error);

      // Mongoose validation error
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: error.message
        });
      }

      // Mongoose cast error (invalid ObjectId)
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid ID format'
        });
      }

      // JWT errors
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      }

      // Default server error
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    });
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      // Connect to database
      const database = Database.getInstance();
      await database.connect();

      // Start server
      this.app.listen(this.port, () => {
        console.log(` Server running on port ${this.port}`);

        console.log(' LOGGING MIDDLEWARE INITIALIZED - SHOULD SEE REQUEST LOGS');
      });

      // Graceful shutdown handlers
      process.on('SIGTERM', this.gracefulShutdown.bind(this));
      process.on('SIGINT', this.gracefulShutdown.bind(this));

    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown handler
   */
  private async gracefulShutdown(signal: string): Promise<void> {
    console.log(`\n Received ${signal}. Starting graceful shutdown...`);
    
    try {
      // Close database connection
      const database = Database.getInstance();
      await database.disconnect();
      
      console.log('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error(' Error during graceful shutdown:', error);
      process.exit(1);
    }
  }
}

// Start server
const server = new Server();
server.start();
