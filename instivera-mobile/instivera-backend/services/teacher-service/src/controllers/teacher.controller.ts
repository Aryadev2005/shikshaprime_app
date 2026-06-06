import { Request, Response } from 'express';
import { TeacherService } from '../services/teacher.service';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess, sendError } from '../utils/response';

const teacherService = new TeacherService();

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId } = req.params;
  const tenant = req.tenant as string;

  if (!teacherId) {
    return sendError(res, 400, 'teacherId is required');
  }

  const profile = await teacherService.getProfile(teacherId, tenant);
  sendSuccess(res, profile, 'Teacher profile retrieved successfully');
});

export const getMyClasses = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const tenant = req.tenant as string;

  const employeeId = user.employee_id || user.user_code || user.username;
  if (!employeeId) {
    return sendError(res, 400, 'Could not resolve employee ID from token');
  }

  const classes = await teacherService.getMyClasses(employeeId, tenant);
  sendSuccess(res, classes, 'Teacher classes retrieved successfully');
});

export const getTimetable = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const tenant = req.tenant as string;

  const employeeId = user.employee_id || user.user_code || user.username;
  if (!employeeId) return sendError(res, 400, 'Could not resolve employee ID from token');

  const events = await teacherService.getTimetable(employeeId, tenant);
  sendSuccess(res, events, 'Timetable retrieved');
});

export const searchTeachers = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const q = (req.query.q as string || '').trim();
  if (q.length < 2) return sendError(res, 400, 'Query must be at least 2 characters');
  const results = await teacherService.searchTeachers(q, tenant);
  sendSuccess(res, results, 'Search results');
});
