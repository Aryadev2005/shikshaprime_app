import { Request } from 'express';

// ── Core auth types ────────────────────────────────────────────────────────────

export interface AuthUser {
  id?: number;
  user_id?: number;
  username?: string;
  role?: string;
  user_type?: string;
  user_code?: string;
  email?: string;
  employee_id?: string;
  student_id?: string;
}

/** Strict subset used after assertPayload — required fields guaranteed by auth middleware */
export interface JwtPayload {
  user_id: number;
  username: string;
  role: string;
  user_type: string;
  user_code: string;
  email: string;
  id?: number;
  sub?: number;
  employee_id?: string;
  student_id?: string;
}

export interface ApiResponse<T = any> {
  status: 0 | 1;
  data: T;
  message: string;
}

export interface UpstreamError {
  status: 0 | 1;
  message: string;
  data?: any;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      tenant?: string;
      token?: string;
    }
  }
}

export type { Request };

// ── Auth types (gateway/src/types/auth.types.ts) ───────────────────────────────

export interface MobileUser {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  avatarInitials: string;
  userCode: string;
}

export interface MobileLoginResponse {
  user: MobileUser;
  token: string;
}

export interface AuthLoginRequest {
  username: string;
  password: string;
}

export interface AuthSendOtpRequest {
  email: string;
}

export interface AuthVerifyOtpRequest {
  email: string;
  otp: string;
}

export interface AuthValidateEmailRequest {
  email: string;
}

export interface IdentityLoginResponse {
  status: 1 | 0;
  data: {
    role: string;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    user_id: string;
    user_type: string;
    user_code: string;
  };
  token: string;
  message: string;
}

export interface IdentitySendOtpResponse {
  status: 1 | 0;
  data: {
    email: string;
    expiresIn: number;
  };
  message: string;
}

export interface IdentityVerifyOtpResponse {
  status: 1 | 0;
  data: {
    token: string;
  };
  message: string;
}

export interface IdentityVerifyOtpErrorResponse {
  status: 0;
  data: {
    attemptsLeft: number;
  };
  message: string;
}

export interface IdentityValidateEmailResponse {
  status: 1 | 0;
  data: {
    exists: boolean;
    first_name?: string;
    last_name?: string;
  };
  message: string;
}

// ── Payment types (gateway/src/types/payment.types.ts) ────────────────────────

export interface UpstreamPayment {
  id: string;
  amount: number;
  paid_amount?: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';
  due_date?: string;
  payment_mode?: string;
  merchant_order_id?: string;
  description?: string;
  created_at?: string;
}

export interface UpstreamPaymentListResponse {
  status: 1 | 0;
  data: UpstreamPayment[];
  message: string;
}

export interface UpstreamPaymentDetailResponse {
  status: 1 | 0;
  data: UpstreamPayment;
  message: string;
}

export interface UpstreamInitiateResponse {
  status: 1 | 0;
  data: {
    paymentId: string;
    merchantOrderId: string;
    amount: number;
    redirectUrl: string;
    expiresAt: string;
  };
  message: string;
}

export interface UpstreamPaymentStatusResponse {
  status: 1 | 0;
  data: {
    status: string;
    gateway_status?: string;
    is_completed: boolean;
  };
  message: string;
}

export interface UpstreamFeesDue {
  id: string;
  fee_head_name: string;
  amount: number;
  paid_amount: number;
  balance: number;
  due_date: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';
}

export interface UpstreamFeesDuesResponse {
  status: 1 | 0;
  data: {
    dues: UpstreamFeesDue[];
  };
  message: string;
}

export interface UpstreamReceipt {
  id: string;
  receipt_number?: string;
  date: string;
  amount: number;
  payment_mode: string;
  description?: string;
}

export interface UpstreamReceiptsResponse {
  status: 1 | 0;
  data: UpstreamReceipt[];
  message: string;
}

export interface UpstreamLedgerEntry {
  date: string;
  description: string;
  debit?: number;
  credit?: number;
  balance: number;
}

export interface UpstreamLedgerResponse {
  status: 1 | 0;
  data: {
    entries: UpstreamLedgerEntry[];
    openingBalance?: number;
    closingBalance?: number;
  };
  message: string;
}

export interface MobileOutstanding {
  totalAmount: number;
  currency: 'INR';
  dueDate: string | null;
  isOverdue: boolean;
}

export interface MobileBreakdownItem {
  label: string;
  amount: number;
  paidAmount: number;
  balance: number;
  status: string;
  dueDate: string;
}

export interface MobileRecentPayment {
  label: string;
  date: string;
  mode: string;
  amount: number;
}

export interface MobilePaymentSummary {
  outstanding: MobileOutstanding;
  annualTotal: number;
  paidSoFar: number;
  primaryPaymentId: string | null;
  breakdown: MobileBreakdownItem[];
  recentPayments: MobileRecentPayment[];
}

export interface MobileReceipt {
  id: string;
  receiptNumber: string;
  date: string;
  amount: number;
  mode: string;
  description: string;
}

export interface MobileInitiateResult {
  paymentId: string;
  merchantOrderId: string;
  amount: number;
  redirectUrl: string;
  expiresAt: string;
}

export interface MobilePaymentStatus {
  status: string;
  gatewayStatus: string | null;
  isCompleted: boolean;
}

export interface MobileLedgerEntry {
  date: string;
  description: string;
  debit?: number;
  credit?: number;
  balance: number;
}

export interface MobileLedger {
  entries: MobileLedgerEntry[];
  openingBalance: number;
  closingBalance: number;
}

export interface InitiatePaymentRequest {
  paymentId: string;
  amount?: number;
}

// ── Attendance types (gateway/src/types/attendance.types.ts) ──────────────────

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

// ── Assignment types (gateway/src/types/assignment.types.ts) ──────────────────

export interface UpstreamAssignment {
  id: string;
  title: string;
  description?: string;
  subject_id?: string;
  subject_name?: string;
  class_id?: string;
  class_name?: string;
  due_date: string;
  status: 'PENDING' | 'SUBMITTED' | 'GRADED' | 'OVERDUE';
  grade?: string;
  marks_obtained?: number;
  max_marks?: number;
  assignment_type?: string;
  instructions?: string;
  file_url?: string;
  allow_late_submissions?: boolean;
  created_at?: string;
}

export interface UpstreamStudentStats {
  total: number;
  pending: number;
  submitted: number;
  graded: number;
}

export interface UpstreamStudentAssignmentStatsResponse {
  status: 1 | 0;
  data: {
    stats: UpstreamStudentStats;
    assignments: UpstreamAssignment[];
  };
  message: string;
}

export interface UpstreamAssignmentListResponse {
  status: 1 | 0;
  data: UpstreamAssignment[];
  message: string;
}

export interface UpstreamSubmission {
  submission_id: string;
  student_id: string;
  student_name?: string;
  submission_date?: string;
  grade?: string;
  marks_obtained?: number;
  feedback?: string;
  file_url?: string;
}

export interface UpstreamAssignmentDetailResponse {
  status: 1 | 0;
  data: UpstreamAssignment & { submissions?: UpstreamSubmission[] };
  message: string;
}

export interface UpstreamSubmitResponse {
  status: 1 | 0;
  data: {
    submission_id: string;
    assignment_id: string;
    submission_date: string;
    status: string;
  };
  message: string;
}

export interface UpstreamMetadataSubject {
  id: string;
  name: string;
  code?: string;
}

export interface UpstreamMetadataClass {
  id: string;
  name: string;
  section?: string;
}

export interface UpstreamMetadataResponse<T> {
  status: 1 | 0;
  data: T[];
  message: string;
}

export interface MobileAssignment {
  id: string;
  title: string;
  subjectName: string;
  dueDate: string;
  status: string;
  progress: number;
  grade?: string;
  type?: string;
}

export interface MobileAssignmentCounters {
  total: number;
  pending: number;
  submitted: number;
  graded: number;
}

export interface MobileAssignmentList {
  counters?: MobileAssignmentCounters;
  assignments: MobileAssignment[];
}

export interface MobileSubmission {
  submissionId: string;
  studentId: string;
  studentName?: string;
  submissionDate?: string;
  grade?: string;
  marksObtained?: number;
  feedback?: string;
}

export interface MobileAssignmentDetail {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  subjectName: string;
  className?: string;
  dueDate: string;
  status: string;
  grade?: string;
  marksObtained?: number;
  maxMarks?: number;
  fileUrl?: string;
  type?: string;
  allowLateSubmissions?: boolean;
  submissions?: MobileSubmission[];
}

export interface MobileSubmitResult {
  submissionId: string;
  assignmentId: string;
  submissionDate: string;
  status: string;
}

export interface MobileMetadata {
  subjects: Array<{ id: string; name: string }>;
  classes: Array<{ id: string; name: string; section?: string }>;
}

export interface GradeSubmissionRequest {
  grade: string;
  marks_obtained: number;
  feedback?: string;
}

export interface CreateAssignmentRequest {
  title: string;
  description?: string;
  class_id: string;
  subject_id: string;
  due_date: string;
  allow_late_submissions?: boolean;
  instructions?: string;
}
