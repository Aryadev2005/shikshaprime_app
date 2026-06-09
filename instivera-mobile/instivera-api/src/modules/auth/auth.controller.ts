import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const result = await AuthService.login(username, password, req.tenant!);
  sendSuccess(res, result, 'Login successful');
});

export const validateEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await AuthService.validateEmail(email, req.tenant!);
  sendSuccess(res, result);
});

export const sendEmailOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await OtpService.sendEmailOtp(email, req.tenant!);
  sendSuccess(res, result);
});

export const verifyEmailOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  const result = await OtpService.verifyEmailOtp(email, otp, req.tenant!);
  sendSuccess(res, result);
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, newPassword } = req.body;
  const result = await AuthService.changePassword(email, newPassword, req.tenant!);
  sendSuccess(res, result);
});
