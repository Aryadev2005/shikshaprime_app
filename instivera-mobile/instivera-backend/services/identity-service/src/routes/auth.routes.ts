import { Router } from 'express';
import * as authController from '../controllers/authController';

const router = Router();

/**
 * Auth routes
 */
router.post('/login', authController.makeLogin);
router.post('/validate-email', authController.validateEmail);
router.post('/send-otp', authController.sendEmailOtp);
router.post('/verify-otp', authController.verifyEmailOtp);

export default router;
