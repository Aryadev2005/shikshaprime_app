import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { TeacherService } from './teacher.service';
import { TeacherAttendanceService } from './teacher-attendance.service';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const result = await TeacherService.getProfile(req.user!.user_code, req.tenant!);
  sendSuccess(res, result);
});

export const getMyClasses = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = await TeacherService.resolveTeacherId(req.user!.user_code, req.tenant!);
  const result = await TeacherService.getMyClasses(teacherId, req.tenant!);
  sendSuccess(res, result);
});

export const getTimetable = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = await TeacherService.resolveTeacherId(req.user!.user_code, req.tenant!);
  const result = await TeacherService.getTimetable(teacherId, req.tenant!);
  sendSuccess(res, result);
});

export const searchTeachers = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query as Record<string, string>;
  const result = await TeacherService.searchTeachers(q || '', req.tenant!);
  sendSuccess(res, result);
});

// Attendance controllers
export const getClassStudents = asyncHandler(async (req: Request, res: Response) => {
  const classId = Number(req.params.classId);
  const result = await TeacherAttendanceService.getClassStudents(classId, req.tenant!);
  sendSuccess(res, result);
});

export const bulkMarkAttendance = asyncHandler(async (req: Request, res: Response) => {
  const classId = Number(req.params.classId);
  const { attendance_date, records } = req.body;
  const result = await TeacherAttendanceService.bulkMarkAttendance(
    classId, attendance_date, records, req.user!.user_code, req.tenant!,
  );
  sendSuccess(res, result, 'Attendance marked successfully');
});

export const getClassSummary = asyncHandler(async (req: Request, res: Response) => {
  const classId = Number(req.params.classId);
  const date = req.query.date as string || new Date().toISOString().split('T')[0];
  const result = await TeacherAttendanceService.getClassSummary(classId, date, req.tenant!);
  sendSuccess(res, result);
});

export const getMyAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = req.query as Record<string, string>;
  const result = await TeacherAttendanceService.getMyAttendance(req.user!.user_code, req.tenant!, { from, to });
  sendSuccess(res, result);
});
