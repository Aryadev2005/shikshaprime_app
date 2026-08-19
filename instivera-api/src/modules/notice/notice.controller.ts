import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { NoticeService } from './notice.service';

export const getNotices = asyncHandler(async (req: Request, res: Response) => {
  const { audience, page, limit } = req.query as Record<string, string>;
  const result = await NoticeService.getNotices(req.tenant!, { audience, page: Number(page), limit: Number(limit) });
  sendSuccess(res, result);
});

export const getNoticeById = asyncHandler(async (req: Request, res: Response) => {
  const result = await NoticeService.getNoticeById(req.params.id, req.tenant!);
  sendSuccess(res, result);
});
