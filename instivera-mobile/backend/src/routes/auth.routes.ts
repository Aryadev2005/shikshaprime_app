import { Router } from 'express';
import * as authController from '../controllers/auth.controller';

export const createAuthRoutes = (): Router => {
  const router = Router();

  router.post('/login', authController.login);
  router.post('/send-otp', authController.sendOtp);
  router.post('/verify-otp', authController.verifyOtp);
  router.post('/validate-email', authController.validateEmail);

  return router;
};
