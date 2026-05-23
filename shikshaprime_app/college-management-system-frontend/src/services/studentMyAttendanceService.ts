import apiClient from "./apiClient";
import { StudentAttendanceRecord } from "./studentAttendanceService";

export interface StudentAttendanceSummary {
  present_days: number;
  absent_days: number;
  total_days: number;
  attendance_percentage: number;
}

export interface MyAttendanceResponse {
  records: StudentAttendanceRecord[];
  summary: StudentAttendanceSummary;
}

// Get student's own attendance records
export async function getMyAttendanceRecords(params: {
  studentId: string;
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
}) {
  const { data } = await apiClient.get("/student/attendance/my-records", { params });
  return { status: data.status, data: data.data as MyAttendanceResponse, message: data.message };
}
