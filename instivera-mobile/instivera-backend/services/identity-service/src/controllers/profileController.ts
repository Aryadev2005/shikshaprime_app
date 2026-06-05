import { NextFunction, Request, Response } from 'express';
import { ProfileService } from '../services/profileService';
import { sendSuccess, sendError } from '../utils/responseHandler';

const profileService = new ProfileService();

/**
 * Get current user profile
 * GET /profile/me
 * Requires: Authorization header with valid JWT
 */
export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = (req as any).tenant || 'default';
    const user = (req as any).user;

    if (!user) {
      sendError(res, 401, 'Not authenticated');
      return;
    }

    const profile = await profileService.getProfile(user.user_id, user.role, tenant);

    sendSuccess(res, profile, 'Profile fetched successfully');
  } catch (error) {
    next(error);
  }
};
