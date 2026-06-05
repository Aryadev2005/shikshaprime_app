import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { OtpService } from '../services/otpService';
import { sendOtpEmail } from '../utils/emailService';
import { sendSuccess, sendError } from '../utils/responseHandler';
import { AppError } from '../utils/appError';

const authService = new AuthService();
const otpService = new OtpService();

/**
 * Login endpoint
 * POST /auth/login
 */
export const makeLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    const tenant = (req as any).tenant || 'default';

    if (!username || !password) {
      sendError(res, 400, 'Username and password are required');
      return;
    }

    const result = await authService.login(username, password, tenant);

    sendSuccess(
      res,
      {
        user: result.user,
        token: result.token,
      },
      'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Validate email endpoint
 * POST /auth/validate-email
 */
export const validateEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const tenant = (req as any).tenant || 'default';

    if (!email) {
      sendError(res, 400, 'Email is required');
      return;
    }

    const result = await authService.validateEmail(email, tenant);

    sendSuccess(
      res,
      result,
      result.exists ? 'User found' : 'User not found'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Send OTP email endpoint
 * POST /auth/send-otp
 */
export const sendEmailOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const tenant = (req as any).tenant || 'default';

    if (!email) {
      sendError(res, 400, 'Email is required');
      return;
    }

    // Verify user exists
    const userResult = await authService.validateEmail(email, tenant);
    if (!userResult.exists) {
      sendError(res, 404, 'No user found with this email');
      return;
    }

    // Generate and store OTP
    const { otp } = await otpService.sendEmailOtp(email, tenant);

    // Send OTP via email
    const name = userResult.first_name || 'User';
    const emailSent = await sendOtpEmail(email, otp, name);

    if (!emailSent) {
      console.log(`🧪 DEV OTP for ${email}: ${otp}`);
    }

    sendSuccess(
      res,
      {
        email,
        expiresIn: 600, // 10 minutes
      },
      'OTP sent to your email'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP endpoint
 * POST /auth/verify-otp
 */
export const verifyEmailOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    const tenant = (req as any).tenant || 'default';

    if (!email || !otp) {
      sendError(res, 400, 'Email and OTP are required');
      return;
    }

    const result = await otpService.verifyEmailOtp(email, otp, tenant);

    if (!result.success) {
      sendError(
        res,
        400,
        'Invalid OTP. Please try again.',
        { attemptsLeft: result.attemptsLeft }
      );
      return;
    }

    sendSuccess(
      res,
      {
        email,
        verified: true,
      },
      'Email OTP verified successfully'
    );
  } catch (error) {
    next(error);
  }
};
