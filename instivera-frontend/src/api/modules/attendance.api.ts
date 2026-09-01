import { apiClient } from '../client';
import { ApiResponse } from '../../types/api';
import {
  MyAttendanceResponse,
  ClassStudentsResponse,
  ClassSummaryResponse,
  BulkMarkPayload,
  BulkMarkResult,
} from '../../types/attendance';

const client = apiClient.getClient();

/** One `student_daily_attendance` row. */
interface RawAttendanceRecord {
  attendance_date: string;
  attendance_status: 'PRESENT' | 'ABSENT' | string;
}

interface RawMyAttendance {
  records: RawAttendanceRecord[];
  summary: {
    present_days: number;
    absent_days: number;
    total_days: number;
    attendance_percentage: number;
  };
}

/** A `mapStudentFromDb` row (student-service utils/mappers.ts). */
interface RawStudentRow {
  id: number;
  student_id: string;
  student_name: string;
  roll_number?: string | null;
  attendance_percentage?: number;
}

/** A row from getStudentAttendanceSummary. */
interface RawSummaryRow {
  student_id: string;
  student_code: string;
  student_name: string;
  roll_number: string;
  attendance_percentage: number;
  daily_status?: 'PRESENT' | 'ABSENT';
}

/**
 * Longest run of PRESENT days ending at the most recent marked day.
 * The backend does not compute a streak.
 */
const streakFrom = (records: RawAttendanceRecord[]): number => {
  const sorted = [...records].sort((a, b) =>
    b.attendance_date.localeCompare(a.attendance_date),
  );
  let streak = 0;
  for (const r of sorted) {
    if (r.attendance_status !== 'PRESENT') break;
    streak += 1;
  }
  return streak;
};

export const attendanceApi = {
  async getMyAttendance(month?: number, year?: number): Promise<MyAttendanceResponse> {
    // getMyAttendanceRecords 400s without an explicit `studentId` and does not
    // derive it from the token, so the caller's numeric students.id has to be
    // looked up first. Tracked in INTEGRATION_LOG.md as a backend fix.
    const me = await client.get<ApiResponse<{ id: number }>>('/api/student/me');
    const studentId = me.data.data?.id;

    const params: Record<string, number | string> = { studentId };
    if (month !== undefined) params.month = month;
    if (year !== undefined) params.year = year;

    const response = await client.get<ApiResponse<RawMyAttendance>>(
      '/api/student/attendance/my-records',
      { params },
    );

    const body = response.data.data;
    const records = body?.records ?? [];
    const s = body?.summary;

    return {
      summary: {
        percentage: s?.attendance_percentage ?? 0,
        presentDays: s?.present_days ?? 0,
        absentDays: s?.absent_days ?? 0,
        totalDays: s?.total_days ?? 0,
        streakDays: streakFrom(records),
      },
      // No per-subject breakdown exists on this endpoint.
      bySubject: [],
      heatmap: records.map((r) => ({
        date: r.attendance_date,
        status:
          r.attendance_status === 'PRESENT' || r.attendance_status === 'ABSENT'
            ? r.attendance_status
            : null,
      })),
    };
  },

  async getClassStudents(classId: string): Promise<ClassStudentsResponse> {
    // There is no /attendance/class-students; the class roster comes from
    // getStudentsByClass, which takes `classId` (studentController.ts:338).
    const response = await client.get<ApiResponse<RawStudentRow[]>>(
      '/api/student/by-class',
      { params: { classId } },
    );

    return {
      students: (response.data.data ?? []).map((r) => ({
        id: String(r.id),
        studentId: String(r.id),
        studentCode: r.student_id,
        name: r.student_name,
        rollNo: r.roll_number ?? '',
        attendancePercentage: r.attendance_percentage ?? 0,
      })),
    };
  },

  async getClassSummary(classId: string, date: string): Promise<ClassSummaryResponse> {
    // The endpoint returns a bare array, takes `classId` (not class_id), and
    // reports single-day status via `daily_status` when the range is one day.
    const response = await client.get<ApiResponse<RawSummaryRow[]>>(
      '/api/student/attendance/summary',
      { params: { classId, startDate: date, endDate: date } },
    );

    return {
      students: (response.data.data ?? []).map((r) => ({
        studentId: String(r.student_id),
        studentCode: r.student_code,
        name: r.student_name,
        rollNo: r.roll_number,
        status: r.daily_status ?? null,
        attendancePercentage: r.attendance_percentage ?? 0,
      })),
    };
  },

  async bulkMarkAttendance(payload: BulkMarkPayload): Promise<BulkMarkResult> {
    // bulkMarkAttendance reads { students, date, marked_by } and ignores
    // classInfo. It responds with data: null, so the count is taken from the
    // request — the write is all-or-nothing on the server.
    await client.post<ApiResponse<null>>('/api/student/attendance/bulk', {
      students: payload.students,
      date: payload.date,
    });

    return { markedCount: payload.students.length, date: payload.date };
  },
};
