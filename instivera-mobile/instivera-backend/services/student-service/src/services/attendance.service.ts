import { Op } from 'sequelize';
import { getTenantModels } from '../models';

export class AttendanceService {
  async getMyAttendance(
    studentId: string,
    tenant: string,
    filters?: { month?: number; year?: number; startDate?: string; endDate?: string }
  ) {
    const { Attendance } = getTenantModels(tenant);

    let dateFilter: any = {};

    if (filters?.startDate && filters?.endDate) {
      dateFilter = {
        [Op.between]: [filters.startDate, filters.endDate]
      };
    } else if (filters?.month && filters?.year) {
      const year = filters.year;
      const month = filters.month;
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      
      dateFilter = {
        [Op.between]: [
          firstDay.toISOString().split('T')[0],
          lastDay.toISOString().split('T')[0]
        ]
      };
    } else {
      // Default: current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      dateFilter = {
        [Op.between]: [
          firstDay.toISOString().split('T')[0],
          lastDay.toISOString().split('T')[0]
        ]
      };
    }

    const records = await Attendance.findAll({
      where: {
        student_id: studentId,
        attendance_date: dateFilter
      },
      order: [['attendance_date', 'ASC']],
      raw: true
    });

    // Calculate summary
    const summary = this.calculateSummary(records);

    return {
      records: records.map((r: any) => ({
        attendance_id: r.attendance_id,
        attendance_date: typeof r.attendance_date === 'string'
          ? r.attendance_date
          : (r.attendance_date instanceof Date ? r.attendance_date.toISOString().split('T')[0] : String(r.attendance_date)),
        attendance_status: r.attendance_status
      })),
      summary
    };
  }

  async getAttendanceSummary(studentId: string, tenant: string) {
    const { Attendance } = getTenantModels(tenant);

    // Get all-time attendance
    const records = await Attendance.findAll({
      where: { student_id: studentId },
      raw: true
    });

    return this.calculateSummary(records);
  }

  private calculateSummary(records: any[]) {
    const summary = {
      present: 0,
      absent: 0,
      late: 0,
      half_day: 0,
      holiday: 0,
      leave: 0,
      total: records.length,
      percentage: 0
    };

    records.forEach(record => {
      switch (record.attendance_status) {
        case 'PRESENT':
          summary.present++;
          break;
        case 'ABSENT':
          summary.absent++;
          break;
        case 'LATE':
          summary.late++;
          break;
        case 'HALF_DAY':
          summary.half_day++;
          break;
        case 'HOLIDAY':
          summary.holiday++;
          break;
        case 'LEAVE':
          summary.leave++;
          break;
      }
    });

    // Calculate percentage (present + late + half_day as positive)
    const totalWorkingDays = summary.total - summary.holiday;
    if (totalWorkingDays > 0) {
      const positiveCount = summary.present + (summary.late * 0.75) + (summary.half_day * 0.5);
      summary.percentage = Math.round((positiveCount / totalWorkingDays) * 100);
    }

    return summary;
  }
}
