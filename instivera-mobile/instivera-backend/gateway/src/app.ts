import crypto from 'crypto';
import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import pinoHttp from 'pino-http';
import logger from './utils/logger';
import { createMasterRouter } from './routes';
import { errorMiddleware } from './middleware/error-middleware';
import { securityHeaders } from './middleware/securityHeaders';
import { sanitizeRequest } from './middleware/sanitize';
import { globalLimiter } from './middleware/rateLimiters';
import { sendError } from './utils/response';

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:8081', 'http://localhost:19000', 'http://localhost:19006'];

export const createApp = (): Express => {
  const app = express();

  // Disable fingerprinting
  app.disable('x-powered-by');

  // Security headers (Helmet)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      frameguard: { action: 'deny' },
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  // CORS
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant'],
    }),
  );

  app.use(compression());

  // Global rate limiter (100 req / 15 min per IP)
  app.use(globalLimiter);

  // Request ID — attach to req and response header for log correlation
  app.use((req: Request, res: Response, next: NextFunction) => {
    const id = crypto.randomUUID();
    (req as any).id = id;
    res.setHeader('X-Request-Id', id);
    next();
  });

  // Logging
  app.use(pinoHttp({ logger }));

  // Body parsing (1 mb hard cap — multer handles multipart separately)
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Root health check (no tenant required, no rate-limit overhead)
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 1,
      data: { service: 'instivera-gateway', version: '1.0.0' },
      message: 'OK',
    });
  });

  // All mobile API routes get: security headers, input sanitization
  const router = createMasterRouter();
  app.use('/api/mobile', securityHeaders, sanitizeRequest, router);

  // 404 Handler
  app.use((_req: Request, res: Response): void => {
    sendError(res, 404, 'Route not found');
  });

  // Error Handler (must be last)
  app.use(errorMiddleware);

  return app;
};
