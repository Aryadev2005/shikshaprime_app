import { Op } from 'sequelize';
import { getTenantModels } from '../../models';
import { AppError } from '../../utils/appError';

// student_daily_attendance.student_id is students.id (numeric), not the varchar
// students.student_id business code these methods are called with — resolve first.
async function resolveNumericStudentId(studentId: string, tenant: string): Promise<number> {
  const { Student } = getTenantModels(tenant);
  const student = await Student.findOne({ where: { student_id: studentId }, attributes: ['id'] });
  if (!student) throw AppError.notFound('Student not found');
  return student.id;
}

export class StudentAttendanceService {
  static async getMyAttendance(studentId: string, tenant: string, filters: { from?: string; to?: string; month?: string; year?: string }) {
    const { StudentDailyAttendance } = getTenantModels(tenant);
    const numericStudentId = await resolveNumericStudentId(studentId, tenant);
    const where: Record<string, any> = { student_id: numericStudentId };

    if (filters.from && filters.to) {
      where.attendance_date = { [Op.between]: [filters.from, filters.to] };
    } else if (filters.month && filters.year) {
      const month = String(filters.month).padStart(2, '0');
      where.attendance_date = {
        [Op.between]: [`${filters.year}-${month}-01`, `${filters.year}-${month}-31`],
      };
    }

    const records = await StudentDailyAttendance.findAll({
      where,
      order: [['attendance_date', 'DESC']],
      attributes: ['id', 'attendance_date', 'attendance_status', 'remarks', 'check_in_time', 'check_out_time'],
    });

    return records;
  }

  static async getAttendanceSummary(studentId: string, tenant: string, _academicYear?: string) {
    const { StudentDailyAttendance } = getTenantModels(tenant);
    const numericStudentId = await resolveNumericStudentId(studentId, tenant);

    const rows = await StudentDailyAttendance.findAll({ where: { student_id: numericStudentId } });
    const total = rows.length;
    const present = rows.filter((r) => !!r.attendance_status && ['PRESENT', 'LATE', 'HALF_DAY'].includes(r.attendance_status)).length;
    const absent = rows.filter((r) => r.attendance_status === 'ABSENT').length;
    const leave = rows.filter((r) => r.attendance_status === 'LEAVE').length;
    const percentage = total > 0 ? parseFloat(((present / total) * 100).toFixed(2)) : 0;

    return { total, present, absent, leave, percentage };
  }
}
