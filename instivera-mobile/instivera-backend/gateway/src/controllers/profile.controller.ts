import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess, sendError } from '../utils/response';
import { identityClient } from '../services/clients';
import { ApiError } from '../utils/api-error';

export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const token = req.token as string;
  const tenant = req.tenant as string;

  if (!token) {
    sendError(res, 401, 'Not authenticated');
    return;
  }

  const response = await identityClient.request(token, tenant, {
    method: 'GET',
    url: '/profile/me',
  });

  const upstream = response.data as { status: number; data: unknown; message: string };

  if (upstream.status !== 1) {
    throw new ApiError(502, upstream.message || 'Failed to fetch profile');
  }

  sendSuccess(res, upstream.data, upstream.message || 'Profile fetched successfully');
});
