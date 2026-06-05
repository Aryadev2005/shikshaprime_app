import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess } from '../utils/response';
import { teacherClient } from '../services/clients';
import { ApiError } from '../utils/api-error';

export const getMyAttendance = asyncHandler(async (req: Request, res: Response) => {
  const token = req.token as string;
  const tenant = req.tenant as string;
  const { month, year } = req.query;

  const response = await teacherClient.request(token, tenant, {
    method: 'GET',
    url: '/my-attendance',
    params: { month, year },
  });

  const upstream = response.data as { status: number; data: unknown; message: string };

  if (upstream.status !== 1) {
    throw new ApiError(502, upstream.message || 'Failed to fetch attendance');
  }

  sendSuccess(res, upstream.data, upstream.message || 'Attendance fetched');
});
