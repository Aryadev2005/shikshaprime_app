import { Router } from 'express';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { getDues, getReceipts, getLedger } from './fees.controller';

const router = Router();
router.use(tenantMiddleware, requireAuth, requireRole('student'));

router.get('/dues', getDues);
router.get('/receipts', getReceipts);
router.get('/ledger', getLedger);

export default router;
