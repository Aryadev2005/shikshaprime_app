import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import pinoHttp from 'pino-http';
import logger from './utils/logger';
import { createMasterRouter } from './routes';
import { errorMiddleware } from './middleware/error-middleware';
import { sendError } from './utils/response';

export const createApp = (): Express => {
  const app = express();

  // Middleware - Security & Performance
  app.use(helmet());
  app.use(cors());
  app.use(compression());

  // Middleware - Logging
  app.use(pinoHttp({ logger }));

  // Middleware - Body parsing
  app.use(express.json({ limit: '5mb' }));

  // Middleware - Root health check (no tenant required)
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 1,
      data: { service: 'instivera-gateway', version: '1.0.0' },
      message: 'OK',
    });
  });

  // Routes
  const router = createMasterRouter();
  app.use('/api/mobile', router);

  // 404 Handler
  app.use((_req: Request, res: Response): void => {
    sendError(res, 404, 'Route not found');
  });

  // Error Handler (must be last)
  app.use(errorMiddleware);

  return app;
};
