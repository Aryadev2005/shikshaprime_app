import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { requireAuth, requireRole } from '../middleware/auth-middleware';

export const createPaymentRoutes = (): Router => {
  const router = Router();

  // All payment routes are student-only
  router.use(requireAuth, requireRole('student'));

  router.get('/summary', paymentController.getSummary);
  router.get('/history', paymentController.getHistory);
  router.post('/initiate', paymentController.initiatePayment);
  router.get('/status/:paymentId', paymentController.getPaymentStatus);
  router.get('/ledger', paymentController.getLedger);

  return router;
};
