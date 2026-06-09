import { Op } from 'sequelize';
import { getTenantModels } from '../../models';
import { AppError } from '../../utils/appError';

export class StudentAttendanceService {
  static async getMyAttendance(studentId: string, tenant: string, filters: { from?: string; to?: string; month?: string; year?: string }) {
    const { StudentDailyAttendance } = getTenantModels(tenant);
    const where: Record<string, any> = { student_id: studentId };

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

  static async getAttendanceSummary(studentId: string, tenant: string, academicYear?: string) {
    const { StudentDailyAttendance } = getTenantModels(tenant);
    const where: Record<string, any> = { student_id: studentId };

    const rows = await StudentDailyAttendance.findAll({ where });
    const total = rows.length;
    const present = rows.filter((r) => ['PRESENT', 'LATE', 'HALF_DAY'].includes(r.attendance_status)).length;
    const absent = rows.filter((r) => r.attendance_status === 'ABSENT').length;
    const leave = rows.filter((r) => r.attendance_status === 'LEAVE').length;
    const percentage = total > 0 ? parseFloat(((present / total) * 100).toFixed(2)) : 0;

    return { total, present, absent, leave, percentage };
  }
}
