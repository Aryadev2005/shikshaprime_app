import { Router } from 'express';
import * as feesController from '../controllers/fees.controller';
import { requireAuth } from '../middleware/auth-middleware';

const router = Router();

// ── Task-spec routes (/fees/* prefix stripped by server.ts) ──────────────────
router.get('/dues/:studentId', requireAuth, feesController.getDues);
router.get('/receipts/:studentId', requireAuth, feesController.getReceipts);
router.get('/ledger/:studentId', requireAuth, feesController.getLedger);

// ── BFF-compatible routes (same router, mounted at / in server.ts) ────────────
// BFF calls:  GET /dues/:studentId
//             GET /receipts/student/:studentId
//             GET /reports/student-ledger?student_id=
router.get('/receipts/student/:id', requireAuth, feesController.getReceipts);
router.get('/reports/student-ledger', requireAuth, feesController.getLedger);

export default router;
