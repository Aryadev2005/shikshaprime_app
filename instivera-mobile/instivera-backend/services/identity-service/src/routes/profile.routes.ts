import { Router } from 'express';
import * as profileController from '../controllers/profileController';
import { requireAuth } from '../middleware/auth-middleware';

const router = Router();

/**
 * Profile routes - all require authentication
 */
router.get('/me', requireAuth, profileController.getMyProfile);

export default router;
