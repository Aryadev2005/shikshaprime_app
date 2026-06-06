import { Request, Response } from 'express';
import { StudentService } from '../services/student.service';
import { AttendanceService } from '../services/attendance.service';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess, sendError } from '../utils/response';

const studentService = new StudentService();
const attendanceService = new AttendanceService();

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const tenant = req.tenant as string;

  if (!studentId) {
    return sendError(res, 400, 'studentId is required');
  }

  const profile = await studentService.getProfile(studentId, tenant);
  sendSuccess(res, profile, 'Student profile retrieved successfully');
});

export const getMyAttendance = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const tenant = req.tenant as string;
  const { month, year, startDate, endDate } = req.query;

  const filters: any = {};
  if (month) filters.month = parseInt(month as string);
  if (year) filters.year = parseInt(year as string);
  if (startDate) filters.startDate = startDate as string;
  if (endDate) filters.endDate = endDate as string;

  const attendance = await attendanceService.getMyAttendance(user.user_code || user.id, tenant, filters);
  sendSuccess(res, attendance, 'Attendance records retrieved successfully');
});

export const getAttendanceSummary = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const tenant = req.tenant as string;

  const summary = await attendanceService.getAttendanceSummary(user.user_code || user.id, tenant);
  sendSuccess(res, summary, 'Attendance summary retrieved successfully');
});

export const searchStudents = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const q = (req.query.q as string || '').trim();
  if (q.length < 2) return sendError(res, 400, 'Query must be at least 2 characters');
  const results = await studentService.searchStudents(q, tenant);
  sendSuccess(res, results, 'Search results');
});