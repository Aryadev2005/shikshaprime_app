import { Router } from 'express';
import { authLimiter } from '../../middleware/rateLimiters';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { login, validateEmail, sendEmailOtp, verifyEmailOtp, changePassword } from './auth.controller';

const router = Router();
router.use(tenantMiddleware);

router.post('/login', authLimiter, login);
router.post('/validate-email', validateEmail);
router.post('/send-otp', sendEmailOtp);
router.post('/verify-otp', verifyEmailOtp);
router.post('/change-password', changePassword);

export default router;
