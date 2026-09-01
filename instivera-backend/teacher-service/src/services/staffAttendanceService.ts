import { Op, fn, col, literal } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import { AppError } from "../utils/appError";
import { getTenantModels } from "../models";

export class StaffAttendanceService {
  /**
   * Mark attendance for a single staff member
   */
  async markAttendance(data, tenant: string) {
    const { StaffDailyAttendance } = getTenantModels(tenant);
    const attendance_id = data.attendance_id || uuidv4();

    // Check if attendance already exists for this employee on this date
    const existing = await StaffDailyAttendance.findOne({
      where: {
        employee_id: data.employee_id,
        attendance_date: data.attendance_date,
      },
    });

    if (existing) {
      // Update existing record
      await existing.update({
        attendance_status: data.attendance_status,
        remarks: data.remarks,
        marked_by: data.marked_by,
        check_in_time: data.check_in_time,
        check_out_time: data.check_out_time,
      });
      return existing;
    }

    // Create new record
    const record = await StaffDailyAttendance.create({
      attendance_id,
      employee_id: data.employee_id!,
      employee_name: data.employee_name,
      employee_code: data.employee_code,
      department_id: data.department_id,
      designation: data.designation,
      attendance_date: data.attendance_date!,
      attendance_status: data.attendance_status!,
      attendance_type: data.attendance_type || "MANUAL",
      marked_by: data.marked_by,
      marked_by_type: data.marked_by_type || "ADMIN",
      remarks: data.remarks,
      created_by: data.created_by,
    });

    return record;
  }

  /**
   * Bulk mark attendance for multiple staff members
   */
  async bulkMarkAttendance(
    date: string,
    staffList: Array<{
      employee_id: string;
      employee_name?: string;
      department_id?: number;
      designation?: string;
      status: 'PRESENT'| 'ABSENT' |'LATE' | 'HALF_DAY' |'HOLIDAY' | 'LEAVE';
    }>,
    markedBy: string,
    tenant: string
  ) {
    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as string[],
    };
    const { StaffDailyAttendance } = getTenantModels(tenant);
    for (const staff of staffList) {
      try {
        const existing = await StaffDailyAttendance.findOne({
          where: {
            employee_id: staff.employee_id,
            attendance_date: date,
          },
        });

        if (existing) {
          await existing.update({
            attendance_status: staff.status,
            marked_by: markedBy,
          });
          results.updated++;
        } else {
          await StaffDailyAttendance.create({
            attendance_id: uuidv4(),
            employee_id: staff.employee_id,
            employee_name: staff.employee_name,
            department_id: staff.department_id,
            designation: staff.designation,
            attendance_date: date? new Date(date) : null,
            attendance_status: staff.status,
            attendance_type: "MANUAL",
            marked_by: markedBy,
            marked_by_type: "ADMIN",
          });
          results.created++;
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Failed for ${staff.employee_id}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Get attendance summary with stats for all staff
   */
  async getAttendanceSummary(filters: {
    startDate?: string;
    endDate?: string;
    department_id?: number;
  },
  tenant: string) {
    const { startDate, endDate, department_id } = filters;

    // Build date filter
    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      dateFilter = { [Op.gte]: startDate };
    } else if (endDate) {
      dateFilter = { [Op.lte]: endDate };
    } else {
      // Default: current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      dateFilter = {
        [Op.between]: [
          firstDay.toISOString().split("T")[0],
          lastDay.toISOString().split("T")[0],
        ],
      };
    }

    // Get all faculty
    const facultyFilter: any = { is_active: true };
    if (department_id) facultyFilter.department_id = department_id;
    const { Teacher, StaffDailyAttendance } = getTenantModels(tenant);
    const allFaculty = await Teacher.findAll({
      where: facultyFilter,
      attributes: ["id", "employee_id", "first_name", "last_name", "department_id", "designation"],
    });

    // Get attendance records
    const attendanceRecords = await StaffDailyAttendance.findAll({
      where: {
        attendance_date: dateFilter,
        ...(department_id ? { department_id } : {}),
      },
    });

    // Build summary for each faculty
    const summary = allFaculty.map((faculty) => {
      const records = attendanceRecords.filter(
        (r) => r.employee_id === faculty.employee_id
      );

      const presentDays = records.filter((r) =>
        ["PRESENT", "LATE", "HALF_DAY", "ON_DUTY"].includes(r.attendance_status)
      ).length;

      const absentDays = records.filter((r) =>
        ["ABSENT", "LEAVE"].includes(r.attendance_status)
      ).length;

      const totalDays = records.length;
      const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      // Get today's status if exists
      //const today = new Date().toISOString().split("T")[0];
      const todayRecord = records.find((r) => r.attendance_date === new Date());

      return {
        employee_id: faculty.employee_id,
        employee_name: faculty.first_name + " " + faculty.last_name,
        department_id: faculty.department_id,
        designation: faculty.designation,
        present_days: presentDays,
        absent_days: absentDays,
        total_days: totalDays,
        attendance_percentage: percentage,
        daily_status: todayRecord?.attendance_status || null,
        manual_status: todayRecord?.attendance_status || null,
      };
    });

    return summary;
  }

  /**
   * Get attendance report for a specific date or date range
   */
  async getAttendanceReport(filters: {
    date?: string;
    month?: string;
    year?: string;
    department_id?: number;
  },
  tenant: string) {
    const { date, month, year, department_id } = filters;

    let whereClause: any = { status: 1 };

    if (date) {
      whereClause.attendance_date = date;
    } else if (month && year) {
      const monthNum = parseInt(String(month), 10);
      const yearNum = parseInt(String(year), 10);
      const monthStr = String(monthNum).padStart(2, "0");
      const startDate = `${yearNum}-${monthStr}-01`;
      const lastDay = new Date(yearNum, monthNum, 0).getDate();
      const lastDayStr = String(lastDay).padStart(2, "0");
      const endDate = `${yearNum}-${monthStr}-${lastDayStr}`;
      whereClause.attendance_date = { [Op.between]: [startDate, endDate] };
    }

    if (department_id) {
      whereClause.department_id = department_id;
    }
    const { StaffDailyAttendance } = getTenantModels(tenant);
    const records = await StaffDailyAttendance.findAll({
      where: whereClause,
      order: [["attendance_date", "DESC"], ["employee_name", "ASC"]],
    });

    return records;
  }

  /**
   * Get attendance for a specific employee
   */
  async getEmployeeAttendance(employeeId: string, filters: { startDate?: string; endDate?: string }, tenant: string) {
    const { startDate, endDate } = filters;

    let whereClause: any = {
      employee_id: employeeId,
      status: 1,
    };

    if (startDate && endDate) {
      whereClause.attendance_date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      whereClause.attendance_date = { [Op.gte]: startDate };
    }
    const { StaffDailyAttendance } = getTenantModels(tenant);
    const records = await StaffDailyAttendance.findAll({
      where: whereClause,
      order: [["attendance_date", "DESC"]],
    });

    return records;
  }

  /**
   * Delete attendance record
   */
  async deleteAttendance(attendanceId: string, tenant: string) {
    const { StaffDailyAttendance } = getTenantModels(tenant);
    const record = await StaffDailyAttendance.findOne({
      where: { attendance_id: attendanceId },
    });

    if (!record) {
      throw new AppError("Attendance record not found", 404);
    }

    await record.update({ status: 0 });
    return { message: "Attendance record deleted successfully" };
  }

  /**
   * Get attendance stats (counts)
   */
  async getAttendanceStats(date: string, tenant: string) {
    const { StaffDailyAttendance, Teacher } = getTenantModels(tenant);
    const targetDate = date || new Date().toISOString().split("T")[0];

    const [presentCount, absentCount, lateCount, leaveCount] = await Promise.all([
      StaffDailyAttendance.count({
        where: { attendance_date: targetDate, attendance_status: "PRESENT" },
      }),
      StaffDailyAttendance.count({
        where: { attendance_date: targetDate, attendance_status: "ABSENT" },
      }),
      StaffDailyAttendance.count({
        where: { attendance_date: targetDate, attendance_status: "LATE" },
      }),
      StaffDailyAttendance.count({
        where: { attendance_date: targetDate, attendance_status: "LEAVE" },
      }),
    ]);

    const totalFaculty = await Teacher.count({
      where: { is_active: true },
    });

    return {
      date: targetDate,
      total_staff: totalFaculty,
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      on_leave: leaveCount,
      not_marked: totalFaculty - (presentCount + absentCount + lateCount + leaveCount),
    };
  }

  /**
   * Get attendance overview for pie chart report
   */
  async getAttendanceStatsOverview(tenant: string, facultyId?: number) {
    const { StaffDailyAttendance } = getTenantModels(tenant);
    const whereClause: any = {
      is_trash: 0,
      status: 1,
    };

    const records = await StaffDailyAttendance.findAll({
      where: whereClause,
      attributes: ["attendance_status", "employee_id", "department_id"],
    });

    let present = 0;
    let absent = 0;
    let excused = 0;

    for (const r of records) {
      const st = r.attendance_status;
      if (st === "PRESENT" || st === "ON_DUTY") {
        present++;
      } else if (st === "ABSENT") {
        absent++;
      } else {
        excused++;
      }
    }

    const total = records.length;
    const averageAttendance = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      presentToday: present,
      excusedToday: excused,
      absentToday: absent,
      averageAttendance,
    };
  }
}

export default new StaffAttendanceService();
