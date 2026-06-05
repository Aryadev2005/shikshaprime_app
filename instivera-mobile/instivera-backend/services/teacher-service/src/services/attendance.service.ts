import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { getTenantModels } from '../models';

export class AttendanceService {
  async getClassStudents(classId: string, date: string, tenant: string) {
    const { Student, StudentDailyAttendance } = getTenantModels(tenant);

    const students = await (Student as any).findAll({
      where: { class_id: Number(classId), status: 1 },
      attributes: ['id', 'student_id', 'student_name', 'roll_number', 'email', 'mobile'],
      order: [['roll_number', 'ASC']],
    });

    // Fetch existing attendance for this class + date
    const existing = await (StudentDailyAttendance as any).findAll({
      where: { class_id: Number(classId), attendance_date: date },
      raw: true,
    });

    const existingMap: Record<string, string> = {};
    for (const rec of existing) {
      existingMap[rec.student_id] = rec.attendance_status;
    }

    return students.map((s: any) => ({
      id: s.id,
      student_id: s.student_id,
      student_name: s.student_name,
      roll_number: s.roll_number,
      email: s.email,
      mobile: s.mobile,
      attendance_status: existingMap[s.student_id] || null,
    }));
  }

  async bulkMarkAttendance(payload: {
    classId: string | number;
    date: string;
    records: Array<{ studentId: string; status: string; studentName?: string; studentCode?: string }>;
    markedBy: string;
    tenant: string;
  }) {
    const { StudentDailyAttendance, Student } = getTenantModels(payload.tenant);
    const results = { created: 0, updated: 0, failed: 0, errors: [] as string[] };

    for (const record of payload.records) {
      try {
        // Look up student name/code if not provided
        let studentName = record.studentName;
        let studentCode = record.studentCode;

        if (!studentName || !studentCode) {
          const student: any = await (Student as any).findOne({
            where: { student_id: record.studentId },
            attributes: ['student_name', 'roll_number'],
            raw: true,
          });
          if (student) {
            studentName = studentName || student.student_name;
            studentCode = studentCode || student.roll_number;
          }
        }

        const existing: any = await (StudentDailyAttendance as any).findOne({
          where: {
            student_id: record.studentId,
            attendance_date: payload.date,
            class_id: Number(payload.classId),
          },
        });

        if (existing) {
          await existing.update({
            attendance_status: record.status,
            marked_by: payload.markedBy,
            attendance_type: 'MOBILE_APP',
            marked_by_type: 'TEACHER',
          });
          results.updated++;
        } else {
          await (StudentDailyAttendance as any).create({
            attendance_id: uuidv4(),
            student_id: record.studentId,
            student_name: studentName,
            student_code: studentCode,
            class_id: Number(payload.classId),
            attendance_date: payload.date,
            attendance_status: record.status,
            attendance_type: 'MOBILE_APP',
            marked_by: payload.markedBy,
            marked_by_type: 'TEACHER',
          });
          results.created++;
        }
      } catch (err: any) {
        results.failed++;
        results.errors.push(`Failed for ${record.studentId}: ${err.message}`);
      }
    }

    return results;
  }

  async getClassSummary(classId: string, date: string, tenant: string) {
    const { Student, StudentDailyAttendance } = getTenantModels(tenant);

    const totalStudents = await (Student as any).count({
      where: { class_id: Number(classId), status: 1 },
    });

    const attendanceRecords = await (StudentDailyAttendance as any).findAll({
      where: { class_id: Number(classId), attendance_date: date },
      raw: true,
    });

    const present = attendanceRecords.filter((r: any) =>
      ['PRESENT', 'LATE', 'HALF_DAY'].includes(r.attendance_status)
    ).length;
    const absent = attendanceRecords.filter((r: any) =>
      ['ABSENT', 'LEAVE'].includes(r.attendance_status)
    ).length;
    const marked = attendanceRecords.length;

    return {
      class_id: classId,
      date,
      total_students: totalStudents,
      marked,
      present,
      absent,
      not_marked: totalStudents - marked,
      attendance_percentage: marked > 0 ? Math.round((present / marked) * 100) : 0,
    };
  }

  async getMyAttendance(employeeId: string, tenant: string, month?: number, year?: number) {
    const { Teacher, StaffDailyAttendance } = getTenantModels(tenant);

    const teacher: any = await (Teacher as any).findOne({
      where: { employee_id: employeeId },
      attributes: ['id', 'employee_id'],
      raw: true,
    });

    if (!teacher) {
      const err: any = new Error('Teacher not found');
      err.status = 404;
      throw err;
    }

    let dateFilter: any;
    if (month && year) {
      const firstDay = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const lastDay = new Date(year, month, 0).toISOString().split('T')[0];
      dateFilter = { [Op.between]: [firstDay, lastDay] };
    } else {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      dateFilter = { [Op.between]: [firstDay, lastDay] };
    }

    const records = await (StaffDailyAttendance as any).findAll({
      where: {
        employee_id: employeeId,
        attendance_date: dateFilter,
      },
      order: [['attendance_date', 'ASC']],
      raw: true,
    });

    const present = records.filter((r: any) => r.attendance_status === 'PRESENT').length;
    const absent = records.filter((r: any) => r.attendance_status === 'ABSENT').length;
    const late = records.filter((r: any) => r.attendance_status === 'LATE').length;
    const leave = records.filter((r: any) => r.attendance_status === 'LEAVE').length;
    const total = records.length;
    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return {
      records: records.map((r: any) => ({
        attendance_id: r.attendance_id,
        attendance_date: typeof r.attendance_date === 'string'
          ? r.attendance_date
          : (r.attendance_date instanceof Date ? r.attendance_date.toISOString().split('T')[0] : String(r.attendance_date)),
        attendance_status: r.attendance_status,
      })),
      summary: { present, absent, late, leave, total, percentage },
    };
  }
}

export default new AttendanceService();
