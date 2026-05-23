import apiClient from "./apiClient";

export interface StaffAttendancePayload {
  date: string;
  staff: {
    employee_id: string;
    employee_name: string;
    department_id?: number;
    designation?: string;
    status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE";
  }[];
  marked_by: string;
}

export interface AttendanceStats {
  date: string;
  total_staff: number;
  present: number;
  absent: number;
  late: number;
  on_leave: number;
  not_marked: number;
}

export interface StaffSummary {
  employee_id: string;
  employee_name: string;
  department_id?: number;
  designation?: string;
  present_days?: number;
  absent_days?: number;
  total_days?: number;
  attendance_percentage?: number;
  daily_status?: string;
}

export interface AttendanceReportRecord {
  employee_id: string;
  employee_name: string;
  attendance_date: string;
  attendance_status: string;
  remarks?: string;
}
export async function getStaffAttendanceStats(date: string) {
  const { data } = await apiClient.get(`/teacher/staff-attendance/stats`, {
    params: { date },
  });
  return { status: data.status, data: data.data as AttendanceStats, message: data.message };
}
export async function getStaffAttendanceSummary(startDate: string, endDate: string) {
  const { data } = await apiClient.get(`/teacher/staff-attendance/summary`, {
    params: { startDate, endDate },
  });
  return { status: data.status, data: data.data as StaffSummary[], message: data.message };
}
export async function submitBulkStaffAttendance(payload: StaffAttendancePayload) {
  const { data } = await apiClient.post(`/teacher/staff-attendance/bulk`, payload);
  return {
    status: data.status,
    data: data.data as { created: number; updated: number },
    message: data.message,
  };
}
export async function getStaffAttendanceReportByDate(date: string) {
  const { data } = await apiClient.get(`/teacher/staff-attendance/report`, {
    params: { date },
  });
  return { status: data.status, data: data.data as AttendanceReportRecord[], message: data.message };
}
export async function getStaffAttendanceReportByMonth(month: string, year: string) {
  const { data } = await apiClient.get(`/teacher/staff-attendance/report`, {
    params: { month, year },
  });
  return { status: data.status, data: data.data as AttendanceReportRecord[], message: data.message };
}
