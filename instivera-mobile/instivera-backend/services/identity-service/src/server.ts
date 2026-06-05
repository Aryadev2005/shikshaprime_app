import express from 'express';
import { json } from 'body-parser';
import config from './config';
import { initializeDatabase, closeDatabase } from './db';
import { setupRoutes } from './routes';
import { authMiddleware } from './middleware/auth-middleware';
import { errorMiddleware } from './middleware/error-middleware';
import { logger } from './utils/logger';

const app = express();

// Middleware
app.use(json());
app.use(authMiddleware);

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
