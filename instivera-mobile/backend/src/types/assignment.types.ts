// Upstream response shapes

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

// Mobile DTO types

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

// Request types

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
