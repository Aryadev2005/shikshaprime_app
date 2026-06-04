import {
  UpstreamAttendanceRecord,
  UpstreamAttendanceSummary,
  UpstreamClassSummaryData,
  UpstreamStudentByClass,
  HeatmapCell,
  MobileAttendancePage,
  MobileClassSummary,
  MobileClassStudents,
} from '../../types/attendance.types';

const toDateStr = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const calculateStreak = (records: UpstreamAttendanceRecord[]): number => {
  const presentDates = new Set(
    records
      .filter((r) => r.attendance_status === 'PRESENT')
      .map((r) => r.attendance_date.slice(0, 10)),
  );

  let streak = 0;
  const current = new Date();

  while (presentDates.has(toDateStr(current))) {
    streak++;
    current.setDate(current.getDate() - 1);
  }

  return streak;
};

export const toStudentAttendanceDTO = (
  records: UpstreamAttendanceRecord[],
  summary: UpstreamAttendanceSummary,
  startDate: Date,
  endDate: Date,
): MobileAttendancePage => {
  const recordMap = new Map<string, 'PRESENT' | 'ABSENT'>();
  records.forEach((r) => {
    const dateKey = r.attendance_date.slice(0, 10);
    recordMap.set(dateKey, r.attendance_status);
  });

  const heatmap: HeatmapCell[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dateStr = toDateStr(current);
    heatmap.push({ date: dateStr, status: recordMap.get(dateStr) ?? null });
    current.setDate(current.getDate() + 1);
  }

  return {
    summary: {
      percentage: summary.attendance_percentage,
      presentDays: summary.present_days,
      absentDays: summary.absent_days,
      totalDays: summary.total_days,
      streakDays: calculateStreak(records),
    },
    bySubject: [] as never[],
    heatmap,
  };
};

export const toClassSummaryDTO = (data: UpstreamClassSummaryData): MobileClassSummary => ({
  students: data.students.map((s) => ({
    studentId: s.student_id,
    studentCode: s.student_code,
    name: s.student_name,
    rollNo: s.roll_no ?? '',
    status: s.status,
    attendancePercentage: s.attendance_percentage,
  })),
});

export const toClassStudentsDTO = (data: UpstreamStudentByClass[]): MobileClassStudents => ({
  students: data.map((s) => ({
    id: s.id,
    studentId: s.student_id,
    studentCode: s.student_code,
    name: s.student_name,
    rollNo: s.roll_no ?? '',
    attendancePercentage: s.attendance_percentage ?? 0,
  })),
});
