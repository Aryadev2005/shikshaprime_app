import { Router } from 'express';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import {
  listPayments, listPaymentsFromToken, getPaymentDetail,
  initiatePayment, getPaymentStatus, getPaymentSummary, getPaymentHistory,
  handleWebhook, testRedirect,
} from './payment.controller';

const router = Router();
router.use(tenantMiddleware);

// Webhook — no auth
router.post('/webhook', handleWebhook);
router.get('/redirect', testRedirect);
router.post('/redirect', testRedirect);

// Auth-required routes
router.use(requireAuth);

// Static/literal paths — MUST come before any /:param path in this router,
// otherwise a bare '/:id' route below matches them first and silently
// returns the wrong payment record instead of 404ing.
router.get('/summary', getPaymentSummary);
router.get('/history', getPaymentHistory);
router.get('/my', listPaymentsFromToken);
router.post('/initiate', initiatePayment);

// Dynamic paths — most-specific first, bare single-segment ':id' last
router.get('/status/:merchantOrderId', getPaymentStatus);
router.get('/student/:studentId', listPayments);
router.get('/:id', getPaymentDetail);

export default router;
