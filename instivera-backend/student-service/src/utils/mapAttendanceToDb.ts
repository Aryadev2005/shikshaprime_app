const ATTENDANCE_STATUS_MAP: Record<string, string> = {
  P: "PRESENT",
  A: "ABSENT",
  L: "LEAVE",
  LT: "LATE",
  HD: "HALF_DAY",
  H: "HOLIDAY"
};

export function mapAttendanceToDb(dto: any) {
  const rawStatus = dto.attendance_status ?? dto.status;

  return {
    academic_year_id: Number(dto.session_id ?? 1),

    student_id: dto.student_id ?? null,
    student_code: dto.student_code ?? null,
    student_name: dto.student_name ?? null,  // NEW: actual student name

    class_id: Number(dto.class_id),

    attendance_date: dto.attendance_date,

    attendance_status:
      ATTENDANCE_STATUS_MAP[rawStatus] ?? rawStatus,

    check_in_time: dto.check_in_time ?? null,
    check_out_time: dto.check_out_time ?? null,

    late_minutes: Number(dto.late_minutes ?? 0),

    attendance_type: dto.attendance_type ?? "MANUAL",

    marked_by: dto.marked_by ?? "SYSTEM",
    marked_by_type: dto.marked_by_type ?? "TEACHER",

    remarks: dto.remarks ?? null,
    absence_reason: dto.absence_reason ?? null,

    parent_notified: 0,
    sms_sent: 0,
    email_sent: 0,

    status: 1,
    is_trash: 0,

    created_by: "SYSTEM"
  };
}