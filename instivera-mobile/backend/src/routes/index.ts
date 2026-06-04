import { Router, Request, Response } from 'express';
import { tenantMiddleware } from '../middleware/tenant-middleware';
import { createAuthRoutes } from './auth.routes';
import { createAttendanceRoutes } from './attendance.routes';
import { createAssignmentRoutes } from './assignment.routes';
import { createPaymentRoutes } from './payment.routes';

export const createMasterRouter = (): Router => {
  const router = Router();

  // Apply tenant middleware to all mobile API routes
  router.use(tenantMiddleware);

  // Health check endpoint
  router.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 1,
      data: { service: 'instivera-mobile-bff', version: '1.0.0' },
      message: 'OK',
    });
  });

  // Mount auth routes (no auth middleware needed - they are entry points)
  const authRoutes = createAuthRoutes();
  router.use('/auth', authRoutes);

  // Attendance routes
  const attendanceRoutes = createAttendanceRoutes();
  router.use('/attendance', attendanceRoutes);

  // Assignment routes
  const assignmentRoutes = createAssignmentRoutes();
  router.use('/assignments', assignmentRoutes);

  // Payment / fees routes
  const paymentRoutes = createPaymentRoutes();
  router.use('/payment', paymentRoutes);

  // TODO: Mount domain routes
  // router.use('/student', studentRoutes);
  // router.use('/chat', chatRoutes);

  return router;
};
