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
  async getMyAttendance(month: number, year: number): Promise<TeacherAttendanceData> {
    const response = await client.get<ApiResponse<TeacherAttendanceData>>(
      '/teacher/my-attendance',
      { params: { month, year } },
    );
    return response.data.data;
  },
};
