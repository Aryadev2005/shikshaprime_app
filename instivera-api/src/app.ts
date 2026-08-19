import express, { Application, Router } from 'express';
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
import authRoutes         from './modules/auth/auth.routes';
import profileRoutes      from './modules/profile/profile.routes';
import institutionsRoutes from './modules/institutions/institutions.routes';
import studentRoutes      from './modules/student/student.routes';
import teacherRoutes      from './modules/teacher/teacher.routes';
import attendanceRoutes   from './modules/attendance/attendance.routes';
import assignmentsRoutes  from './modules/assignments/assignments.routes';
import repositoryRoutes   from './modules/repository/repository.routes';
import feesRoutes         from './modules/fees/fees.routes';
import paymentRoutes      from './modules/payment/payment.routes';
import chatRoutes         from './modules/chat/chat.routes';
import noticeRoutes       from './modules/notice/notice.routes';
import registrationRoutes from './modules/registration/registration.routes';

export function createApp(): Application {
  const app = express();

  // ── Security & transport middleware ────────────────────────────────────────
  app.use(helmet());
  app.use(cors({
    origin: config.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }));
  app.use(compression() as any);
  app.use(pinoHttp({ logger }) as any);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use('/uploads', express.static('uploads'));
  app.use(generalLimiter);

  // ── Root-level public endpoints (NO prefix, NO tenant) ────────────────────
  // Used by run-ios.sh healthcheck probe: curl http://127.0.0.1:4000/health
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 1,
      data: { service: 'instivera-api', version: '1.0.0' },
      message: 'OK',
    });
  });

  app.get('/db-check', async (_req, res) => {
    const { testConnection } = await import('./db');
    try {
      await testConnection();
      res.json({ status: 1, message: 'Connected to ShikshaPrime MySQL successfully' });
    } catch (err: any) {
      res.status(500).json({ status: 0, message: 'Database connection failed', error: err.message });
    }
  });

  // ── /api/mobile/institutions — PUBLIC, pre-tenant ─────────────────────────
  // Registered BEFORE tenantMiddleware. Login screen fetches institution list
  // before the user has selected one (no x-tenant header yet at this point).
  app.use('/api/mobile/institutions', institutionsRoutes);

  // ── All other /api/mobile routes — require valid x-tenant header ───────────
  const mobileRouter = Router();

  // Public mobile routes (no auth, but tenant IS known at this point)
  mobileRouter.use('/auth',         authRoutes);
  mobileRouter.use('/registration', registrationRoutes);
  // Payment webhook called by PhonePe — auth verified by signature per-route
  mobileRouter.use('/payment',      paymentRoutes);

  // Protected mobile routes (auth checked inside each router)
  mobileRouter.use('/profile',     profileRoutes);
  mobileRouter.use('/student',     studentRoutes);
  mobileRouter.use('/teacher',     teacherRoutes);
  mobileRouter.use('/attendance',  attendanceRoutes);
  mobileRouter.use('/assignments', assignmentsRoutes);
  mobileRouter.use('/repository',  repositoryRoutes);
  mobileRouter.use('/fees',        feesRoutes);
  mobileRouter.use('/chat',        chatRoutes);
  mobileRouter.use('/notices',     noticeRoutes);

  app.use('/api/mobile', tenantMiddleware, mobileRouter);

  // ── Global error handler — MUST be last ───────────────────────────────────
  app.use(errorMiddleware);

  return app;
}
