import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { requireAuth } from '../middleware/auth-middleware';

const router = Router();

// ── Task-spec routes (/payments/* prefix stripped by server.ts) ───────────────
// IMPORTANT: static paths (/detail/:id, /status/:id, /initiate, /webhook)
// must come BEFORE /:studentId to prevent shadowing.
router.get('/test-redirect', paymentController.testRedirect);
router.post('/webhook', paymentController.handleWebhook);           // no auth — verified by signature
router.post('/initiate', requireAuth, paymentController.initiatePayment);
router.get('/detail/:paymentId', requireAuth, paymentController.getPaymentDetail);
router.get('/status/:paymentId', requireAuth, paymentController.getPaymentStatus);
router.get('/:studentId', requireAuth, paymentController.listPayments);

export default router;
