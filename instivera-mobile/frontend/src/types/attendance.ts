export interface HeatmapCell {
  date: string;
  status: 'PRESENT' | 'ABSENT' | null;
}

export interface AttendanceSummary {
  percentage: number;
  presentDays: number;
  absentDays: number;
  totalDays: number;
  streakDays: number;
}

export interface MyAttendanceResponse {
  summary: AttendanceSummary;
  bySubject: never[];
  heatmap: HeatmapCell[];
}

export interface ClassStudent {
  id: string;
  studentId: string;
  studentCode: string;
  name: string;
  rollNo: string;
  attendancePercentage: number;
}

export interface ClassStudentsResponse {
  students: ClassStudent[];
}

export interface ClassSummaryStudent {
  studentId: string;
  studentCode: string;
  name: string;
  rollNo: string;
  status: 'PRESENT' | 'ABSENT' | null;
  attendancePercentage: number;
}

export interface ClassSummaryResponse {
  students: ClassSummaryStudent[];
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

export interface BulkMarkPayload {
  students: Array<{
    student_id: string;
    student_code: string;
    student_name: string;
    status: AttendanceStatus;
  }>;
  date: string;
  classInfo: { class_id: string; subject?: string };
}

export interface BulkMarkResult {
  markedCount: number;
  date: string;
}
