import { Router } from 'express';
import { sendOTP, verifyOTP, checkValidation } from '../controllers/otpController';

const router = Router();

// Send OTP to phone number
router.post('/send', sendOTP);

// Verify OTP
router.post('/verify', verifyOTP);

// Check if phone number is already validated
router.get('/check-validation/:phone_number', checkValidation);

export default router;