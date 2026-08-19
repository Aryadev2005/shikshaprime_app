import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendError } from '../../utils/response';
import { getTenantModels } from '../../models';
import { TeacherAttendanceService } from '../teacher/teacher-attendance.service';
import { StudentAttendanceService } from '../student/attendance.service';

// ── GET /api/mobile/attendance/my-records?month=X&year=Y (student) ────────────
export const getMyRecords = asyncHandler(async (req: Request, res: Response) => {
  const { month, year, from, to } = req.query as Record<string, string>;
  const result = await StudentAttendanceService.getMyAttendance(
    req.user!.user_code!,
    req.tenant!,
    { month, year, from, to },
  );
  sendSuccess(res, result);
});

// ── GET /api/mobile/attendance/class-students?class_id=X (teacher) ───────────
export const getClassStudents = asyncHandler(async (req: Request, res: Response) => {
  const classId = Number(req.query.class_id);
  if (!classId || isNaN(classId)) {
    sendError(res, 400, 'class_id query parameter is required');
    return;
  }

  const rows = await TeacherAttendanceService.getClassStudents(classId, req.tenant!);

  const students = (rows as any[]).map((s) => ({
    id: String(s.id),
    studentId: s.student_id,
    studentCode: s.student_id,
    name: s.student_name || `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim(),
    rollNo: s.roll_number || '',
    attendancePercentage: 0,
  }));

  sendSuccess(res, { students });
});

// ── GET /api/mobile/attendance/summary?class_id=X&date=YYYY-MM-DD (teacher) ──
// Returns per-student attendance status for the given date — joins the student
// list with that day's attendance records since the service only returns totals.
export const getClassSummary = asyncHandler(async (req: Request, res: Response) => {
  const classId = Number(req.query.class_id);
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  if (!classId || isNaN(classId)) {
    sendError(res, 400, 'class_id query parameter is required');
    return;
  }

  const { StudentDailyAttendance } = getTenantModels(req.tenant!);

  const studentRows = await TeacherAttendanceService.getClassStudents(classId, req.tenant!);
  // student_daily_attendance has no class_id column — scope via this class's
  // student list (numeric id), then map back onto student_id (business code) for display.
  const numericIds = (studentRows as any[]).map((s) => s.id);
  const attendanceRows = numericIds.length
    ? await StudentDailyAttendance.findAll({
        where: { student_id: { [Op.in]: numericIds }, attendance_date: date as any },
        attributes: ['student_id', 'attendance_status'],
      })
    : [];

  const statusMap: Record<number, string | undefined> = {};
  (attendanceRows as any[]).forEach((r) => {
    statusMap[r.student_id] = r.attendance_status;
  });

  const students = (studentRows as any[]).map((s) => ({
    studentId: s.student_id,
    studentCode: s.student_id,
    name: s.student_name || `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim(),
    rollNo: s.roll_number || '',
    status: (statusMap[s.id] ?? null) as 'PRESENT' | 'ABSENT' | null,
    attendancePercentage: 0,
  }));

  sendSuccess(res, { students });
});

// ── POST /api/mobile/attendance/bulk-mark (teacher) ───────────────────────────
// Frontend payload: { students: [{student_id, student_code, student_name, status}],
//                    date, classInfo: { class_id, subject? } }
// Service expects:  (classId, attendanceDate, records[{student_id, attendance_status}],
//                    markedBy, tenant)
export const bulkMark = asyncHandler(async (req: Request, res: Response) => {
  const { students, date, classInfo } = req.body as {
    students: Array<{
      student_id: string;
      student_code: string;
      student_name: string;
      status: string;
    }>;
    date: string;
    classInfo: { class_id: string | number; subject?: string };
  };

  if (!classInfo?.class_id) { sendError(res, 400, 'classInfo.class_id is required'); return; }
  if (!date)                 { sendError(res, 400, 'date is required'); return; }
  if (!students || !Array.isArray(students) || students.length === 0) {
    sendError(res, 400, 'students array is required and must not be empty');
    return;
  }

  // Reject future dates
  const markDate = new Date(date);
  markDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (markDate > today) {
    sendError(res, 400, 'Cannot mark attendance for a future date');
    return;
  }

  // Map frontend field name 'status' → service field name 'attendance_status'
  const records = students.map((s) => ({
    student_id: s.student_id,
    attendance_status: s.status,
  }));

  const serviceResult = await TeacherAttendanceService.bulkMarkAttendance(
    Number(classInfo.class_id),
    date,
    records,
    req.user!.user_code!,
    req.tenant!,
  );

  sendSuccess(
    res,
    { markedCount: (serviceResult as any).marked ?? records.length, date },
    `Attendance marked for ${(serviceResult as any).marked ?? records.length} student(s)`,
  );
});
