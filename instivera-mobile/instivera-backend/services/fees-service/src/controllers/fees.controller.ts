import { Request, Response } from 'express';
import { FeesService } from '../services/fees.service';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess, sendError } from '../utils/response';

const feesService = new FeesService();

// GET /fees/dues/:studentId  OR  /dues/:studentId
export const getDues = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const studentId = req.params.studentId || req.params.student_id;
  if (!studentId) return sendError(res, 400, 'studentId is required');

  const data = await feesService.getDues(studentId, tenant);
  sendSuccess(res, data, 'Dues retrieved successfully');
});

// GET /fees/receipts/:studentId  OR  /receipts/student/:studentId
export const getReceipts = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const studentId = req.params.studentId || req.params.id;
  if (!studentId) return sendError(res, 400, 'studentId is required');

  const data = await feesService.getReceipts(studentId, tenant);
  sendSuccess(res, data, 'Receipts retrieved successfully');
});

// GET /fees/ledger/:studentId  OR  /reports/student-ledger?student_id=
export const getLedger = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const studentId =
    req.params.studentId || (req.query.student_id as string);
  if (!studentId) return sendError(res, 400, 'studentId is required');

  const data = await feesService.getLedger(studentId, tenant);
  sendSuccess(res, data, 'Ledger retrieved successfully');
});
