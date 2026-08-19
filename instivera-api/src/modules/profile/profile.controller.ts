import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { ProfileService } from './profile.service';

export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const { email, role } = req.user!;
  const result = await ProfileService.getProfile(email, role, req.tenant!);
  sendSuccess(res, result);
});
