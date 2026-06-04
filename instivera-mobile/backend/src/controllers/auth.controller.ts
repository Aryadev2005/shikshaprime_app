import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess, sendError } from '../utils/response';
import { authService } from '../services/auth.service';
import {
  AuthLoginRequest,
  AuthSendOtpRequest,
  AuthVerifyOtpRequest,
  AuthValidateEmailRequest,
} from '../types/auth.types';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body as AuthLoginRequest;
  const tenant = req.tenant as string;

  if (!username || !password) {
    sendError(res, 400, 'Username and password are required');
    return;
  }

  const result = await authService.login(username, password, tenant);

  sendSuccess(res, result, 'Login successful', 200);
});

export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as AuthSendOtpRequest;
  const tenant = req.tenant as string;

  if (!email) {
    sendError(res, 400, 'Email is required');
    return;
  }

  const result = await authService.sendOtp(email, tenant);

  sendSuccess(res, result.data, result.message, 200);
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body as AuthVerifyOtpRequest;
  const tenant = req.tenant as string;

  if (!email || !otp) {
    sendError(res, 400, 'Email and OTP are required');
    return;
  }

  const result = await authService.verifyOtp(email, otp, tenant);

  sendSuccess(res, result, 'OTP verified successfully', 200);
});

export const validateEmail = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body as AuthValidateEmailRequest;
    const tenant = req.tenant as string;

    if (!email) {
      sendError(res, 400, 'Email is required');
      return;
    }

    const result = await authService.validateEmail(email, tenant);

    sendSuccess(res, result.data, result.message, 200);
  },
);
