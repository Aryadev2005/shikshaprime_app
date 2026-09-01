import { QueryTypes } from "sequelize";
import { getTenantSequelize } from "../server";

type DashboardParams = {
  tenant: string;
  departmentId?: number;
  programId?: number;
  semesterId?: number;
  streamId?: number;
  academicYearId?: number;
  earningsAcademicYearId?: number;
  attendanceYear?: number;
  earningsYear?: number;
};

function toNumber(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export class AdminDashboardService {

  async getDashboardData(params: DashboardParams) {
    const sequelize = getTenantSequelize(params.tenant);

    const attendanceYear = toNumber(params.attendanceYear) || new Date().getFullYear();
    const earningsYear = toNumber(params.earningsYear) || new Date().getFullYear();
    const departmentId = params.departmentId ? toNumber(params.departmentId) : (params.streamId ? toNumber(params.streamId) : undefined);
    const programId = params.programId ? toNumber(params.programId) : undefined;
    const semesterId = params.semesterId ? toNumber(params.semesterId) : undefined;

    // ---------------- SUMMARY ----------------
    let summary = {
      students_count: 0,
      teachers_count: 0,
      leads_count: 0,
      submitted_assignments_count: 0,
      total_revenue: 0,
    };

    try {
      const result = await sequelize.query(
        `SELECT
          (SELECT COUNT(*) FROM students) AS students_count,
          (SELECT COUNT(*) FROM teachers WHERE COALESCE(is_active, 1) = 1) AS teachers_count,
          (SELECT COUNT(*) FROM lead_master) AS leads_count,
          (
            SELECT COUNT(*)
            FROM student_assignment_submissions
            WHERE LOWER(COALESCE(status, 'submitted')) IN ('submitted', 'graded')
          ) AS submitted_assignments_count,
          (
            SELECT COALESCE(SUM(amount_paid), 0)
            FROM payment_transactions
          ) AS total_revenue`,
        { type: QueryTypes.SELECT }
      );

      summary = (result as any[])[0] || summary;
    } catch (error: any) {
      console.warn("[adminDashboard] summary failed:", error?.message);
    }

    // ---------------- ACADEMIC YEARS ----------------
    let academicYearOptions: any[] = [];
    try {
      academicYearOptions = await sequelize.query(
        `SELECT id, name, start_date, end_date, is_active FROM academic_years ORDER BY start_date DESC`,
        { type: QueryTypes.SELECT }
      );
    } catch (error: any) {
      console.warn("[adminDashboard] academicYearOptions failed:", error?.message);
    }

    const selectedAcadYear = params.academicYearId
      ? academicYearOptions.find((a) => toNumber(a.id) === toNumber(params.academicYearId))
      : academicYearOptions.find((a) => a.is_active === 1 || a.is_active === true) || academicYearOptions[0];

    const selectedEarningsAcadYear = params.earningsAcademicYearId
      ? academicYearOptions.find((a) => toNumber(a.id) === toNumber(params.earningsAcademicYearId))
      : selectedAcadYear;

    // ---------------- DEPARTMENT OPTIONS ----------------
    let departmentOptions: any[] = [];
    try {
      departmentOptions = await sequelize.query(
        `SELECT id, code, name FROM departments ORDER BY name ASC`,
        { type: QueryTypes.SELECT }
      );
    } catch (error: any) {
      console.warn("[adminDashboard] departmentOptions failed:", error?.message);
    }

    // ---------------- PROGRAM OPTIONS ----------------
    let programOptions: any[] = [];
    try {
      programOptions = await sequelize.query(
        `SELECT id, department_id, code, name FROM programs ORDER BY name ASC`,
        { type: QueryTypes.SELECT }
      );
    } catch (error: any) {
      console.warn("[adminDashboard] programOptions failed:", error?.message);
    }

    // ---------------- SEMESTER OPTIONS ----------------
    let semesterOptions: any[] = [];
    try {
      if (programId) {
        semesterOptions = await sequelize.query(
          `SELECT id, program_id, semester_number, name FROM semesters WHERE program_id = :programId ORDER BY semester_number ASC, name ASC`,
          { replacements: { programId }, type: QueryTypes.SELECT }
        );
      } else {
        semesterOptions = await sequelize.query(
          `SELECT id, program_id, semester_number, name FROM semesters ORDER BY semester_number ASC, name ASC`,
          { type: QueryTypes.SELECT }
        );
      }
    } catch (error: any) {
      console.warn("[adminDashboard] semesterOptions failed:", error?.message);
    }

    if (!semesterOptions || semesterOptions.length === 0) {
      semesterOptions = Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        program_id: null,
        semester_number: i + 1,
        name: `Semester ${i + 1}`,
      }));
    }

    // ---------------- STREAM OPTIONS (LEGACY) ----------------
    let streamOptions: any[] = [];
    try {
      streamOptions = await sequelize.query(
        `SELECT
          d.id,
          d.name,
          COUNT(spd.student_id) AS student_count
        FROM departments d 
        INNER JOIN programs p ON p.department_id = d.id
        INNER JOIN student_personal_details spd ON spd.program_id = p.id
        where spd.student_id is not null
        GROUP BY d.id, d.name
        ORDER BY d.name`,
        { type: QueryTypes.SELECT }
      );
    } catch (error: any) {
      console.warn("[adminDashboard] streamOptions failed:", error?.message);
    }

    // ---------------- GENDER DISTRIBUTION ----------------
    let genderDistribution: any = {
      department_id: departmentId ?? null,
      program_id: programId ?? null,
      semester_id: semesterId ?? null,
      boys_count: 0,
      girls_count: 0,
      total_count: 0,
    };

    try {
      const conditions: string[] = [];
      const replacements: any = {};

      if (departmentId) {
        conditions.push("d.id = :departmentId");
        replacements.departmentId = departmentId;
      }

      if (programId) {
        conditions.push("p.id = :programId");
        replacements.programId = programId;
      }

      if (semesterId) {
        conditions.push("(s.semester_id = :semesterId OR sem.id = :semesterId OR sem.semester_number = :semesterId)");
        replacements.semesterId = semesterId;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const result = await sequelize.query(
        `SELECT
            SUM(CASE WHEN LOWER(TRIM(COALESCE(s.gender, ''))) IN ('male','m','boy','boys') THEN 1 ELSE 0 END) AS boys_count,
            SUM(CASE WHEN LOWER(TRIM(COALESCE(s.gender, ''))) IN ('female','f','girl','girls') THEN 1 ELSE 0 END) AS girls_count,
            COUNT(s.id) AS total_count
          FROM students s 
          LEFT JOIN student_personal_details spd ON (spd.student_id = s.id OR spd.user_id = s.user_id)
          LEFT JOIN programs p ON p.id = spd.program_id 
          LEFT JOIN departments d ON d.id = p.department_id
          LEFT JOIN semesters sem ON sem.id = s.semester_id
          ${whereClause}`,
        {
          replacements,
          type: QueryTypes.SELECT,
        }
      );

      genderDistribution = (result as any[])[0] || genderDistribution;
    } catch (error: any) {
      console.warn("[adminDashboard] genderDistribution failed:", error?.message);
    }

    // ---------------- TEACHER LIST ----------------
    let teacherList: any[] = [];
    try {
      teacherList = await sequelize.query(
        `SELECT
          t.id,
          t.employee_id,
          CONCAT_WS(' ', t.first_name, t.last_name) AS name,
          d.name AS department_name,
          t.phone
        FROM teachers t
        LEFT JOIN departments d ON d.id = t.department_id
        WHERE COALESCE(t.is_active, 1) = 1
        ORDER BY t.created_at DESC, t.id DESC`,
        { type: QueryTypes.SELECT }
      );
    } catch (error: any) {
      console.warn("[adminDashboard] teacherList failed:", error?.message);
    }

    // ---------------- NOTICES ----------------
    let notices: any[] = [];
    try {
      notices = await sequelize.query(
        `SELECT id, title, description, attachment, from_date, to_date
         FROM notices
         WHERE DATE(to_date) >= CURDATE() AND DATE(from_date) <= CURDATE()
         ORDER BY from_date DESC, id DESC
         LIMIT 3`,
        { type: QueryTypes.SELECT }
      );
    } catch (error: any) {
      console.warn("[adminDashboard] notices failed:", error?.message);
    }

    // ---------------- ATTENDANCE (STAFF DAILY ATTENDANCE) ----------------
    let attendanceRows: any[] = [];
    try {
      let whereCondition = "";
      const replacements: any = {};

      if (selectedAcadYear?.start_date && selectedAcadYear?.end_date) {
        whereCondition = "WHERE attendance_date BETWEEN :startDate AND :endDate";
        replacements.startDate = selectedAcadYear.start_date;
        replacements.endDate = selectedAcadYear.end_date;
      } else {
        whereCondition = "WHERE YEAR(attendance_date) = :attendanceYear";
        replacements.attendanceYear = attendanceYear;
      }

      attendanceRows = await sequelize.query(
        `SELECT
          MONTH(attendance_date) AS month_number,
          SUM(CASE WHEN attendance_status IN ('PRESENT', 'LATE', 'HALF_DAY', 'ON_DUTY') THEN 1 ELSE 0 END) AS present_count,
          SUM(CASE WHEN attendance_status IN ('ABSENT', 'LEAVE') THEN 1 ELSE 0 END) AS absent_count
        FROM staff_daily_attendance
        ${whereCondition}
        GROUP BY MONTH(attendance_date)
        ORDER BY MONTH(attendance_date)`,
        {
          replacements,
          type: QueryTypes.SELECT,
        }
      );
    } catch (error: any) {
      console.warn("[adminDashboard] staff attendance failed:", error?.message);
    }

    // ---------------- EARNINGS ----------------
    let earningsRows: any[] = [];
    let totalEarningsForYear = 0;

    try {
      let whereCondition = "";
      const replacements: any = {};

      if (selectedEarningsAcadYear?.start_date && selectedEarningsAcadYear?.end_date) {
        whereCondition = "WHERE (payment_date BETWEEN :startDate AND :endDate OR created_at BETWEEN :startDate AND :endDate)";
        replacements.startDate = selectedEarningsAcadYear.start_date;
        replacements.endDate = selectedEarningsAcadYear.end_date;
      } else {
        whereCondition = "WHERE YEAR(COALESCE(payment_date, created_at)) = :earningsYear";
        replacements.earningsYear = earningsYear;
      }

      earningsRows = await sequelize.query(
        `SELECT
          MONTH(COALESCE(payment_date, created_at)) AS month_number,
          COALESCE(SUM(amount_paid), 0) AS amount
        FROM payment_transactions
        ${whereCondition}
        GROUP BY MONTH(COALESCE(payment_date, created_at))
        ORDER BY MONTH(COALESCE(payment_date, created_at))`,
        {
          replacements,
          type: QueryTypes.SELECT,
        }
      );

      const totalResult = await sequelize.query(
        `SELECT COALESCE(SUM(amount_paid), 0) AS total_earnings
         FROM payment_transactions
         ${whereCondition}`,
        {
          replacements,
          type: QueryTypes.SELECT,
        }
      );

      totalEarningsForYear = toNumber((totalResult as any[])[0]?.total_earnings);
    } catch (error: any) {
      console.warn("[adminDashboard] earnings failed:", error?.message);
    }

    // ---------------- FORMAT ----------------
    const attendanceByMonth = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const row = attendanceRows.find(r => toNumber(r.month_number) === m);
      return {
        month: m,
        present: toNumber(row?.present_count),
        absent: toNumber(row?.absent_count),
      };
    });

    const earningsByMonth = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const row = earningsRows.find(r => toNumber(r.month_number) === m);
      return {
        month: m,
        amount: toNumber(row?.amount),
      };
    });

    return {
      summary: {
        studentsCount: toNumber(summary.students_count),
        teachersCount: toNumber(summary.teachers_count),
        leadsCount: toNumber(summary.leads_count),
        submittedAssignmentsCount: toNumber(summary.submitted_assignments_count),
        totalRevenue: toNumber(summary.total_revenue),
      },
      studentDistribution: {
        departmentId: departmentId ?? null,
        programId: programId ?? null,
        semesterId: semesterId ?? null,
        streamId: genderDistribution.stream_id || departmentId || null,
        streamName: genderDistribution.stream_name || null,
        boysCount: toNumber(genderDistribution.boys_count),
        girlsCount: toNumber(genderDistribution.girls_count),
        totalCount: toNumber(genderDistribution.total_count),
        departmentOptions: departmentOptions.map((d: any) => ({
          id: toNumber(d.id),
          name: d.name,
          code: d.code,
        })),
        programOptions: programOptions.map((p: any) => ({
          id: toNumber(p.id),
          departmentId: toNumber(p.department_id),
          name: p.name,
          code: p.code,
        })),
        semesterOptions: semesterOptions.map((sem: any) => ({
          id: toNumber(sem.id),
          programId: sem.program_id != null ? toNumber(sem.program_id) : null,
          semesterNumber: toNumber(sem.semester_number),
          name: sem.name,
        })),
        streamOptions: streamOptions.map((s: any) => ({
          id: toNumber(s.id),
          name: s.name,
          studentCount: toNumber(s.student_count),
        })),
      },
      teacherList,
      notices,
      attendance: {
        year: attendanceYear,
        selectedAcademicYearId: selectedAcadYear ? toNumber(selectedAcadYear.id) : null,
        academicYearOptions: academicYearOptions.map((a: any) => ({
          id: toNumber(a.id),
          name: a.name,
          startDate: a.start_date,
          endDate: a.end_date,
          isActive: Boolean(a.is_active),
        })),
        monthly: attendanceByMonth,
      },
      earnings: {
        year: earningsYear,
        totalEarnings: totalEarningsForYear,
        selectedAcademicYearId: selectedEarningsAcadYear ? toNumber(selectedEarningsAcadYear.id) : null,
        academicYearOptions: academicYearOptions.map((a: any) => ({
          id: toNumber(a.id),
          name: a.name,
          startDate: a.start_date,
          endDate: a.end_date,
          isActive: Boolean(a.is_active),
        })),
        monthly: earningsByMonth,
      },
    };
  }
}