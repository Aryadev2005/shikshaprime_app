import express from 'express';
import { json } from 'body-parser';
import config from './config';
import { initializeDatabase, closeDatabase, globalSequelize } from './db';
import { setupRoutes } from './routes';
import { authMiddleware } from './middleware/auth-middleware';
import { errorMiddleware } from './middleware/error-middleware';
import { logger } from './utils/logger';

const app = express();

// Middleware
app.use(json());
app.use(authMiddleware);

// DB connection check endpoint
app.get('/db-check', async (_req, res) => {
  try {
    await globalSequelize.authenticate();
    res.json({
      status: 1,
      message: 'Connected to ShikshaPrime MySQL successfully',
      host: config.db.host,
      database: config.db.name,
    });
  } catch (err: any) {
    res.status(500).json({
      status: 0,
      message: 'Database connection failed',
      error: err.message,
    });
  }
});

// Setup routes
setupRoutes(app);

// Global error handling middleware (must be last)
app.use(errorMiddleware);

/**
 * Start server
 */
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();

    // Start listening
    app.listen(config.port, () => {
      logger.info(`✅ Identity Service listening on port ${config.port}`);
      logger.info(`📍 Environment: ${config.node_env}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      await closeDatabase();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...');
      await closeDatabase();
      process.exit(0);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
