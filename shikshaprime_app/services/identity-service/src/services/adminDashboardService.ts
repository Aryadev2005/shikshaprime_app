import { QueryTypes } from "sequelize";
import { getTenantSequelize } from "../server";

type DashboardParams = {
  tenant: string;
  streamId?: number;
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
    const streamId = params.streamId ? toNumber(params.streamId) : undefined;

    // ---------------- SUMMARY ----------------
    let summary = {
      students_count: 0,
      teachers_count: 0,
      submitted_assignments_count: 0,
      total_revenue: 0,
    };

    try {
      const result = await sequelize.query(
        `SELECT
          (SELECT COUNT(*) FROM students WHERE COALESCE(status, 1) = 1) AS students_count,
          (SELECT COUNT(*) FROM teachers WHERE COALESCE(is_active, 1) = 1) AS teachers_count,
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

    // ---------------- STREAM OPTIONS ----------------
    let streamOptions: any[] = [];
    try {
      streamOptions = await sequelize.query(
        `SELECT
          d.id,
          d.name,
          COUNT(s.id) AS student_count
        FROM departments d
        INNER JOIN students s ON s.department_id = d.id
        WHERE COALESCE(s.status, 1) = 1
        GROUP BY d.id, d.name
        ORDER BY d.name`,
        { type: QueryTypes.SELECT }
      );
    } catch (error: any) {
      console.warn("[adminDashboard] streamOptions failed:", error?.message);
    }

    // ---------------- GENDER DISTRIBUTION ----------------
    let genderDistribution: any = {
      stream_id: streamId ?? null,
      stream_name: null,
      boys_count: 0,
      girls_count: 0,
      total_count: 0,
    };

    try {
      const result = await sequelize.query(
        `SELECT
          d.id AS stream_id,
          d.name AS stream_name,
          SUM(CASE WHEN LOWER(TRIM(COALESCE(s.sex, ''))) IN ('male','m','boy','boys') THEN 1 ELSE 0 END) AS boys_count,
          SUM(CASE WHEN LOWER(TRIM(COALESCE(s.sex, ''))) IN ('female','f','girl','girls') THEN 1 ELSE 0 END) AS girls_count,
          COUNT(s.id) AS total_count
        FROM students s
        INNER JOIN departments d ON d.id = s.department_id
        WHERE COALESCE(s.status, 1) = 1
        ${streamId ? "AND d.id = :streamId" : ""}
        GROUP BY d.id, d.name
        ORDER BY COUNT(s.id) DESC, d.name ASC
        LIMIT 1`,
        {
          replacements: streamId ? { streamId } : {},
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
        ORDER BY t.created_at DESC, t.id DESC
        LIMIT 5`,
        { type: QueryTypes.SELECT }
      );
    } catch (error: any) {
      console.warn("[adminDashboard] teacherList failed:", error?.message);
    }

    // ---------------- NOTICES ----------------
    let notices: any[] = [];
    try {
      notices = await sequelize.query(
        `SELECT id, title, description, from_date, to_date
         FROM notices
         ORDER BY from_date DESC, id DESC
         LIMIT 3`,
        { type: QueryTypes.SELECT }
      );
    } catch (error: any) {
      console.warn("[adminDashboard] notices failed:", error?.message);
    }

    // ---------------- ATTENDANCE ----------------
    let attendanceRows: any[] = [];
    try {
      attendanceRows = await sequelize.query(
        `SELECT
          MONTH(attendance_date) AS month_number,
          SUM(CASE WHEN attendance_status = 'PRESENT' THEN 1 ELSE 0 END) AS present_count,
          SUM(CASE WHEN attendance_status = 'ABSENT' THEN 1 ELSE 0 END) AS absent_count
        FROM student_daily_attendance
        WHERE YEAR(attendance_date) = :attendanceYear
        GROUP BY MONTH(attendance_date)
        ORDER BY MONTH(attendance_date)`,
        {
          replacements: { attendanceYear },
          type: QueryTypes.SELECT,
        }
      );
    } catch (error: any) {
      console.warn("[adminDashboard] attendance failed:", error?.message);
    }

    // ---------------- EARNINGS ----------------
    let earningsRows: any[] = [];
    try {
      earningsRows = await sequelize.query(
        `SELECT
          MONTH(COALESCE(payment_date, created_at)) AS month_number,
          COALESCE(SUM(amount_paid), 0) AS amount
        FROM payment_transactions
        WHERE YEAR(COALESCE(payment_date, created_at)) = :earningsYear
        GROUP BY MONTH(COALESCE(payment_date, created_at))
        ORDER BY MONTH(COALESCE(payment_date, created_at))`,
        {
          replacements: { earningsYear },
          type: QueryTypes.SELECT,
        }
      );
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
        submittedAssignmentsCount: toNumber(summary.submitted_assignments_count),
        totalRevenue: toNumber(summary.total_revenue),
      },
      studentDistribution: {
        streamId: genderDistribution.stream_id,
        streamName: genderDistribution.stream_name,
        boysCount: toNumber(genderDistribution.boys_count),
        girlsCount: toNumber(genderDistribution.girls_count),
        totalCount: toNumber(genderDistribution.total_count),
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
        monthly: attendanceByMonth,
      },
      earnings: {
        year: earningsYear,
        monthly: earningsByMonth,
      },
    };
  }
}