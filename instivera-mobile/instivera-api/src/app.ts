import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { pinoHttp } from 'pino-http';
import config from './config';
import logger from './utils/logger';
import { tenantMiddleware } from './middleware/tenant.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { generalLimiter } from './middleware/rateLimiters';

// Module routes
import authRoutes from './modules/auth/auth.routes';
import profileRoutes from './modules/profile/profile.routes';
import institutionsRoutes from './modules/institutions/institutions.routes';
import studentRoutes from './modules/student/student.routes';
import teacherRoutes from './modules/teacher/teacher.routes';
import assignmentsRoutes from './modules/assignments/assignments.routes';
import repositoryRoutes from './modules/repository/repository.routes';
import feesRoutes from './modules/fees/fees.routes';
import paymentRoutes from './modules/payment/payment.routes';
import chatRoutes from './modules/chat/chat.routes';
import noticeRoutes from './modules/notice/notice.routes';
import registrationRoutes from './modules/registration/registration.routes';

export function createApp(): Application {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS
  app.use(cors({
    origin: config.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }));

  // Compression
  app.use(compression() as any);

  // HTTP logging
  app.use(pinoHttp({ logger }) as any);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static files for uploaded assignment files
  app.use('/uploads', express.static('uploads'));

  // Global rate limiter
  app.use(generalLimiter);

  // Health check — no tenant required (used by run-ios.sh healthcheck)
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 1,
      data: { service: 'instivera-api', version: '1.0.0' },
      message: 'OK',
    });
  });

  // DB health check — no tenant required
  app.get('/db-check', async (_req, res) => {
    const { testConnection } = await import('./db');
    try {
      await testConnection();
      res.json({ status: 1, message: 'Connected to ShikshaPrime MySQL successfully' });
    } catch (err: any) {
      res.status(500).json({ status: 0, message: 'Database connection failed', error: err.message });
    }
  });

  // Apply tenant middleware to all API routes
  app.use(tenantMiddleware);

  // ── Route mounting ─────────────────────────────────────────────────────────
  // PUBLIC routes (no auth middleware at router level)
  app.use('/auth', authRoutes);
  app.use('/institutions', institutionsRoutes);
  app.use('/registration', registrationRoutes);
  app.use('/payment', paymentRoutes);  // payment/webhook is public, auth checked per-route

  // PROTECTED routes (auth checked per-route inside each router)
  app.use('/profile', profileRoutes);
  app.use('/student', studentRoutes);
  app.use('/teacher', teacherRoutes);
  app.use('/assignments', assignmentsRoutes);
  app.use('/repository', repositoryRoutes);
  app.use('/fees', feesRoutes);
  app.use('/chat', chatRoutes);
  app.use('/notices', noticeRoutes);

  // Global error handler — MUST be last
  app.use(errorMiddleware);

  return app;
}
