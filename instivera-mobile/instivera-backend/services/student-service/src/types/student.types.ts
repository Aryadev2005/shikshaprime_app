export interface StudentProfile {
  id: number;
  student_id: string;
  student_name?: string;
  roll_number?: string;
  email?: string;
  mobile?: string;
  department_id: number;
  department?: {
    id: number;
    name: string;
    code: string;
  };
}

export interface AttendanceRecord {
  attendance_id: string;
  attendance_date: string;
  attendance_status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'HOLIDAY' | 'LEAVE';
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  half_day: number;
  holiday: number;
  leave: number;
  total: number;
  percentage: number;
}

export interface MyAttendanceResponse {
  records: AttendanceRecord[];
  summary: AttendanceSummary;
}