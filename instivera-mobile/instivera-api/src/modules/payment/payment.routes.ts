import { Router } from 'express';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import {
  listPayments, listPaymentsFromToken, getPaymentDetail,
  initiatePayment, getPaymentStatus, handleWebhook, testRedirect,
} from './payment.controller';

const router = Router();
router.use(tenantMiddleware);

// Webhook — no auth
router.post('/webhook', handleWebhook);
router.get('/redirect', testRedirect);
router.post('/redirect', testRedirect);

// Auth-required routes
router.use(requireAuth);
router.get('/student/:studentId', listPayments);
router.get('/my', listPaymentsFromToken);
router.get('/:id', getPaymentDetail);
router.post('/initiate', initiatePayment);
router.get('/status/:merchantOrderId', getPaymentStatus);

export default router;
