import { Router } from 'express';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requireAuth } from '../../middleware/auth.middleware';
import { getMyProfile } from './profile.controller';

const router = Router();
router.use(tenantMiddleware, requireAuth);

router.get('/me', getMyProfile);

export default router;
