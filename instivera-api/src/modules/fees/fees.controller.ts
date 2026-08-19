import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { FeesService } from './fees.service';

export const getDues = asyncHandler(async (req: Request, res: Response) => {
  const studentId = req.user!.user_code!;
  const result = await FeesService.getDues(studentId, req.tenant!);
  sendSuccess(res, result);
});

export const getReceipts = asyncHandler(async (req: Request, res: Response) => {
  const studentId = req.user!.user_code!;
  const result = await FeesService.getReceipts(studentId, req.tenant!);
  sendSuccess(res, result);
});

export const getLedger = asyncHandler(async (req: Request, res: Response) => {
  const studentId = req.user!.user_code!;
  const result = await FeesService.getLedger(studentId, req.tenant!);
  sendSuccess(res, result);
});
