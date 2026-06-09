import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { StudentService } from './student.service';
import { StudentAttendanceService } from './attendance.service';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const studentId = req.user!.user_code;
  const result = await StudentService.getProfile(studentId, req.tenant!);
  sendSuccess(res, result);
});

export const getMyAttendance = asyncHandler(async (req: Request, res: Response) => {
  const studentId = req.user!.user_code;
  const { from, to, month, year } = req.query as Record<string, string>;
  const result = await StudentAttendanceService.getMyAttendance(studentId, req.tenant!, { from, to, month, year });
  sendSuccess(res, result);
});

export const getAttendanceSummary = asyncHandler(async (req: Request, res: Response) => {
  const studentId = req.user!.user_code;
  const { academic_year } = req.query as Record<string, string>;
  const result = await StudentAttendanceService.getAttendanceSummary(studentId, req.tenant!, academic_year);
  sendSuccess(res, result);
});

export const searchStudents = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query as Record<string, string>;
  const result = await StudentService.searchStudents(q || '', req.tenant!);
  sendSuccess(res, result);
});
