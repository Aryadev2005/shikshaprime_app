import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess, sendError } from '../utils/response';
import { attendanceService } from '../services/attendance.service';
import { BulkMarkRequest } from '../types/attendance.types';

export const getMyRecords = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const tenant = req.tenant as string;
  const token = req.token as string;

  const result = await attendanceService.getMyRecords(user.user_code, token, tenant);

  sendSuccess(res, result, 'Attendance records fetched');
});

export const getClassSummary = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const token = req.token as string;
  const { class_id, date } = req.query;

  if (!class_id || !date) {
    sendError(res, 400, 'class_id and date are required');
    return;
  }

  const result = await attendanceService.getClassSummary(
    class_id as string,
    date as string,
    token,
    tenant,
  );

  sendSuccess(res, result, 'Class summary fetched');
});

export const getClassStudents = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const token = req.token as string;
  const { class_id } = req.query;

  if (!class_id) {
    sendError(res, 400, 'class_id is required');
    return;
  }

  const result = await attendanceService.getClassStudents(class_id as string, token, tenant);

  sendSuccess(res, result, 'Class students fetched');
});

export const bulkMark = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const tenant = req.tenant as string;
  const token = req.token as string;
  const body = req.body as BulkMarkRequest;

  if (!body.students || !Array.isArray(body.students) || body.students.length === 0) {
    sendError(res, 400, 'students array is required');
    return;
  }

  if (!body.date) {
    sendError(res, 400, 'date is required');
    return;
  }

  // Reject future dates
  const markDate = new Date(body.date);
  markDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (markDate > today) {
    sendError(res, 400, 'Cannot mark attendance for a future date');
    return;
  }

  const result = await attendanceService.bulkMark(body, user.username, token, tenant);

  sendSuccess(res, result, `Attendance marked for ${result.markedCount} students`);
});
