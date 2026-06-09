import { Router } from 'express';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import { getNotices, getNoticeById } from './notice.controller';

const router = Router();
router.use(tenantMiddleware, requireAuth);

router.get('/', getNotices);
router.get('/:id', getNoticeById);

export default router;
