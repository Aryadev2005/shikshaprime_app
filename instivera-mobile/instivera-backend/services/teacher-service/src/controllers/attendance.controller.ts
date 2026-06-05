import { Request, Response } from 'express';
import { AttendanceService } from '../services/attendance.service';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess, sendError } from '../utils/response';

const attendanceService = new AttendanceService();

export const getClassStudents = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const { classId, date } = req.query;

  if (!classId) {
    return sendError(res, 400, 'classId is required');
  }
  if (!date) {
    return sendError(res, 400, 'date is required');
  }

  const students = await attendanceService.getClassStudents(
    classId as string,
    date as string,
    tenant
  );
  sendSuccess(res, students, 'Class students retrieved successfully');
});

export const bulkMarkAttendance = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const tenant = req.tenant as string;
  const { classId, date, records } = req.body;

  if (!classId) {
    return sendError(res, 400, 'classId is required');
  }
  if (!date) {
    return sendError(res, 400, 'date is required');
  }
  if (!records || !Array.isArray(records) || records.length === 0) {
    return sendError(res, 400, 'records array is required and must not be empty');
  }

  // Reject future dates
  const markDate = new Date(date);
  markDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (markDate > today) {
    return sendError(res, 400, 'Cannot mark attendance for a future date');
  }

  const markedBy = user.employee_id || user.user_code || user.username || 'UNKNOWN';

  const result = await attendanceService.bulkMarkAttendance({
    classId,
    date,
    records,
    markedBy,
    tenant,
  });

  sendSuccess(
    res,
    result,
    `Attendance marked: ${result.created} created, ${result.updated} updated, ${result.failed} failed`
  );
});

export const getClassSummary = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const { classId, date } = req.query;

  if (!classId) {
    return sendError(res, 400, 'classId is required');
  }
  if (!date) {
    return sendError(res, 400, 'date is required');
  }

  const summary = await attendanceService.getClassSummary(
    classId as string,
    date as string,
    tenant
  );
  sendSuccess(res, summary, 'Class attendance summary retrieved successfully');
});

export const getMyAttendance = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const tenant = req.tenant as string;
  const { month, year } = req.query;

  const employeeId = user.employee_id || user.user_code || user.username;
  if (!employeeId) {
    return sendError(res, 400, 'Could not resolve employee ID from token');
  }

  const attendance = await attendanceService.getMyAttendance(
    employeeId,
    tenant,
    month ? parseInt(month as string) : undefined,
    year ? parseInt(year as string) : undefined
  );
  sendSuccess(res, attendance, 'Teacher attendance records retrieved successfully');
});
