import { Op } from 'sequelize';
import { getTenantModels } from '../../models';
import { AppError } from '../../utils/appError';

export class TeacherAttendanceService {
  static async getClassStudents(classId: number, tenant: string) {
    const { Student } = getTenantModels(tenant);
    return Student.findAll({
      where: { class_id: classId, is_active: 1 },
      attributes: ['id', 'student_id', 'student_name', 'first_name', 'last_name', 'roll_number', 'profile_picture'],
      order: [['roll_number', 'ASC']],
    });
  }

  static async bulkMarkAttendance(
    classId: number,
    attendanceDate: string,
    records: { student_id: string; attendance_status: string; remarks?: string }[],
    markedBy: string,
    tenant: string,
  ) {
    const today = new Date().toISOString().split('T')[0];
    if (attendanceDate > today) throw AppError.badRequest('Cannot mark attendance for future dates');

    const { StudentDailyAttendance } = getTenantModels(tenant);

    const upserts = records.map((r) =>
      StudentDailyAttendance.upsert({
        attendance_id: `${classId}-${r.student_id}-${attendanceDate}`,
        student_id: r.student_id,
        class_id: classId,
        attendance_date: attendanceDate as any,
        attendance_status: r.attendance_status as any,
        attendance_type: 'MOBILE_APP',
        marked_by: markedBy,
        marked_by_type: 'TEACHER',
        remarks: r.remarks,
      } as any),
    );

    await Promise.all(upserts);
    return { marked: records.length };
  }

  static async getClassSummary(classId: number, date: string, tenant: string) {
    const { StudentDailyAttendance } = getTenantModels(tenant);
    const rows = await StudentDailyAttendance.findAll({
      where: { class_id: classId, attendance_date: date as any },
    });

    const summary: Record<string, number> = { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0, HALF_DAY: 0 };
    rows.forEach((r) => { if (r.attendance_status in summary) summary[r.attendance_status]++; });
    return { date, class_id: classId, total: rows.length, ...summary };
  }

  static async getMyAttendance(employeeId: string, tenant: string, filters: { from?: string; to?: string }) {
    const { StaffDailyAttendance } = getTenantModels(tenant);
    const where: Record<string, any> = { employee_id: employeeId };
    if (filters.from && filters.to) {
      where.attendance_date = { [Op.between]: [filters.from, filters.to] };
    }
    return StaffDailyAttendance.findAll({
      where,
      order: [['attendance_date', 'DESC']],
      attributes: ['id', 'attendance_date', 'attendance_status', 'check_in_time', 'check_out_time', 'remarks'],
    });
  }
}
