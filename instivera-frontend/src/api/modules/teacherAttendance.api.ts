import { apiClient } from '../client';
import { ApiResponse } from '../../types/api';

export type StaffAttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'HALF_DAY'
  | 'HOLIDAY'
  | 'LEAVE'
  | 'ON_DUTY';

export interface TeacherAttendanceRecord {
  attendance_id: string;
  attendance_date: string; // 'YYYY-MM-DD'
  attendance_status: StaffAttendanceStatus;
}

export interface TeacherAttendanceSummary {
  present: number;
  absent: number;
  late: number;
  leave: number;
  total: number;
  percentage: number;
}

export interface TeacherAttendanceData {
  records: TeacherAttendanceRecord[];
  summary: TeacherAttendanceSummary;
}

const client = apiClient.getClient();

export const teacherAttendanceApi = {
  /**
   * MISSING BACKEND ENDPOINT — deliberately left unrepointed.
   *
   * teacher-service has no self-service attendance route. What exists:
   *   - GET /api/teacher/staff-attendance/overview — institution-wide counts
   *     (presentToday/absentToday/excusedToday/averageAttendance), no per-day
   *     records, and its `facultyId` query param is never applied to the query.
   *   - GET /api/teacher/staff-attendance/employee/:employeeId — per-employee,
   *     but `requireRole('admin')`.
   *   - GET /api/teacher/faculty/me/profile — self-scoped, but returns only
   *     12 monthly percentages, no dated statuses.
   *
   * This calendar needs dated `{attendance_date, attendance_status}` rows for
   * the caller. Repointing at the admin-scoped route would be a different
   * permission model and would leak other staff's attendance, so the call is
   * left as-is and fails loudly. See INTEGRATION_LOG.md.
   */
  async getMyAttendance(month: number, year: number): Promise<TeacherAttendanceData> {
    const response = await client.get<ApiResponse<TeacherAttendanceData>>(
      '/teacher/my-attendance',
      { params: { month, year } },
    );
    return response.data.data;
  },
};
