import { Request, Response } from 'express';
import { NoticeService } from '../services/notice.service';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess, sendError } from '../utils/response';

const noticeService = new NoticeService();

export const getNotices = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const { audience, page, limit } = req.query;

  const validAudiences = ['STUDENT', 'TEACHER', 'ALL'];
  const parsedAudience = audience as string | undefined;
  if (parsedAudience && !validAudiences.includes(parsedAudience)) {
    return sendError(res, 400, `audience must be one of: ${validAudiences.join(', ')}`);
  }

  const result = await noticeService.getNotices(tenant, {
    audience: parsedAudience as 'STUDENT' | 'TEACHER' | 'ALL' | undefined,
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 20,
  });

  sendSuccess(res, result, 'Notices retrieved successfully');
});

export const getNoticeById = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const { id } = req.params;

  if (!id) {
    return sendError(res, 400, 'Notice ID is required');
  }

  const notice = await noticeService.getNoticeById(id, tenant);
  sendSuccess(res, notice, 'Notice retrieved successfully');
});
