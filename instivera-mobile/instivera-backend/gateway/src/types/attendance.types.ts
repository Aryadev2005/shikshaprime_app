// Upstream student-service response shapes
export interface UpstreamAttendanceRecord {
  attendance_id: string;
  student_id: string;
  attendance_date: string;
  attendance_status: 'PRESENT' | 'ABSENT';
}

export interface UpstreamAttendanceSummary {
  present_days: number;
  absent_days: number;
  total_days: number;
  attendance_percentage: number;
}

export interface UpstreamMyRecordsData {
  records: UpstreamAttendanceRecord[];
  summary: UpstreamAttendanceSummary;
}

export interface UpstreamMyRecordsResponse {
  status: 1 | 0;
  data: UpstreamMyRecordsData;
  message: string;
}

export interface UpstreamStudentSummaryItem {
  student_id: string;
  student_code: string;
  student_name: string;
  roll_no?: string;
  status: 'PRESENT' | 'ABSENT' | null;
  attendance_percentage: number;
}

export interface UpstreamClassSummaryData {
  students: UpstreamStudentSummaryItem[];
}

export interface UpstreamClassSummaryResponse {
  status: 1 | 0;
  data: UpstreamClassSummaryData;
  message: string;
}

export interface UpstreamStudentByClass {
  id: string;
  student_id: string;
  student_code: string;
  student_name: string;
  roll_no?: string;
  attendance_percentage?: number;
}

export interface UpstreamByClassResponse {
  status: 1 | 0;
  data: UpstreamStudentByClass[];
  message: string;
}

export interface UpstreamBulkMarkResponse {
  status: 1 | 0;
  data: { count: number };
  message: string;
}

// Mobile DTO types
export interface HeatmapCell {
  date: string;
  status: 'PRESENT' | 'ABSENT' | null;
}

export interface MobileAttendanceSummary {
  percentage: number;
  presentDays: number;
  absentDays: number;
  totalDays: number;
  streakDays: number;
}

export interface MobileAttendancePage {
  summary: MobileAttendanceSummary;
  bySubject: never[];
  heatmap: HeatmapCell[];
}

export interface MobileClassStudent {
  id: string;
  studentId: string;
  studentCode: string;
  name: string;
  rollNo: string;
  attendancePercentage: number;
}

export interface MobileClassStudentSummary {
  studentId: string;
  studentCode: string;
  name: string;
  rollNo: string;
  status: 'PRESENT' | 'ABSENT' | null;
  attendancePercentage: number;
}

export interface MobileClassSummary {
  students: MobileClassStudentSummary[];
}

export interface MobileClassStudents {
  students: MobileClassStudent[];
}

// Request types
export interface BulkMarkStudent {
  student_id: string;
  student_code: string;
  student_name: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

export interface BulkMarkRequest {
  students: BulkMarkStudent[];
  date: string;
  classInfo: {
    class_id: string;
    subject?: string;
  };
}

export interface BulkMarkResult {
  markedCount: number;
  date: string;
}
