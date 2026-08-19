export interface AssignmentCounters {
  total: number;
  pending: number;
  submitted: number;
  graded: number;
}

export interface Assignment {
  id: string;
  title: string;
  subjectName: string;
  dueDate: string;
  status: 'PENDING' | 'SUBMITTED' | 'GRADED' | 'OVERDUE' | string;
  progress: number;
  grade?: string;
  type?: string;
  teacherName?: string;
}

export interface AssignmentListResponse {
  counters?: AssignmentCounters;
  assignments: Assignment[];
}

export interface AssignmentSubmission {
  submissionId: string;
  studentId: string;
  studentName?: string;
  submissionDate?: string;
  grade?: string;
  marksObtained?: number;
  feedback?: string;
}

export interface AssignmentDetail {
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
  submissions?: AssignmentSubmission[];
}

export interface SubmitAssignmentResult {
  submissionId: string;
  assignmentId: string;
  submissionDate: string;
  status: string;
}

export interface AssignmentMetadata {
  subjects: Array<{ id: string; name: string }>;
  classes: Array<{ id: string; name: string; section?: string }>;
}

export interface GradeSubmissionPayload {
  grade: string;
  marks_obtained: number;
  feedback?: string;
}

export interface CreateAssignmentPayload {
  title: string;
  description?: string;
  class_id: string;
  subject_id: string;
  due_date: string;
  allow_late_submissions?: boolean;
  instructions?: string;
}
