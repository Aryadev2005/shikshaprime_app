import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authLimiter } from '../middleware/rateLimiters';

export const createAuthRoutes = (): Router => {
  const router = Router();

  router.post('/login', authLimiter, authController.login);
  router.post('/send-otp', authLimiter, authController.sendOtp);
  router.post('/verify-otp', authLimiter, authController.verifyOtp);
  router.post('/validate-email', authLimiter, authController.validateEmail);

  return router;
};
