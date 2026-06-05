import { Router } from 'express';
import { requireAuth } from '../middleware/auth-middleware';
import { getMyProfile } from '../controllers/profile.controller';

export const createProfileRoutes = (): Router => {
  const router = Router();

  router.get('/me', requireAuth, getMyProfile);

  return router;
};
