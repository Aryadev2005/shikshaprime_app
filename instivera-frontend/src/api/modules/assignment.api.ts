import { apiClient } from '../client';
import { ApiResponse } from '../../types/api';
import { useAuthStore } from '../../store/authStore';
import {
  AssignmentListResponse,
  AssignmentDetail,
  AssignmentSubmission,
  SubmitAssignmentResult,
  AssignmentMetadata,
  GradeSubmissionPayload,
  CreateAssignmentPayload,
  Assignment,
} from '../../types/assignment';

const client = apiClient.getClient();

// Reads the store's canonical `role` (hydrated from SecureStore / the JWT).
// This previously read `user?.role`, which was null after every app restart —
// so students silently fell through to the teacher endpoints and got a 403.
const isStudent = (): boolean => useAuthStore.getState().role === 'student';

// ── Raw backend shapes (Sequelize JSON) — instivera-api's assignments module
// returns model rows directly rather than a pre-shaped view-model, so this
// adapter maps them into the app's existing Assignment/AssignmentDetail types.
interface RawSubmission {
  id: number;
  student_id: string;
  student_name?: string;
  submission_text?: string;
  file_url?: string;
  submitted_at?: string;
  marks_obtained?: number;
  grade?: string;
  feedback?: string;
  status?: string;
  created?: boolean;
}

interface RawAssignment {
  id: number;
  title: string;
  description?: string;
  detailed_instructions?: string;
  type?: string;
  due_date?: string;
  maximum_marks?: number;
  allow_late_submissions?: number;
  file_url?: string;
  subject?: { id: number; name: string; code: string };
  class?: { id: number; name: string; code: string };
  submissions?: RawSubmission[];
}

// ── student-service shapes ───────────────────────────────────────────────────
// student-service returns flat, pre-statused rows rather than the nested
// teacher_assignments model rows the teacher endpoints emit.

interface RawStudentAssignmentRow {
  id: number;
  title: string;
  subject_id?: number;
  subject_name?: string | null;
  type?: string;
  due_date?: string;
  assignment_submission_id?: number | null;
  status?: 'Submitted' | 'Overdue' | 'Pending' | string;
}

interface RawStudentStats {
  total: number;
  pending: number;
  submitted: number;
  overdue: number;
  graded: number;
  avgGrade: number | null;
}

interface RawStudentAssignmentDetail {
  assignment_title?: string;
  assignment_description?: string;
  due_date?: string;
  due_time?: string;
  allow_late_submissions?: number | boolean;
  attachments?: Array<{ attachment_id: number; file_name: string; file_url: string | null }>;
}

const STUDENT_STATUS: Record<string, Assignment['status']> = {
  Submitted: 'SUBMITTED',
  Overdue: 'OVERDUE',
  Pending: 'PENDING',
};

const toStudentAssignment = (raw: RawStudentAssignmentRow): Assignment => ({
  id: String(raw.id),
  title: raw.title,
  subjectName: raw.subject_name ?? '',
  dueDate: raw.due_date ?? '',
  status: STUDENT_STATUS[raw.status ?? ''] ?? 'PENDING',
  progress: raw.assignment_submission_id ? 100 : 0,
  type: raw.type,
});

// The detail endpoint carries no subject, class, marks or submission state —
// only title/description/due date/attachments. See INTEGRATION_LOG.md.
const toStudentAssignmentDetail = (
  id: string,
  raw: RawStudentAssignmentDetail,
): AssignmentDetail => ({
  id,
  title: raw?.assignment_title ?? '',
  description: raw?.assignment_description,
  subjectName: '',
  dueDate: raw?.due_date ?? '',
  status: raw?.due_date && new Date(raw.due_date) < new Date() ? 'OVERDUE' : 'PENDING',
  fileUrl: raw?.attachments?.[0]?.file_url ?? undefined,
  allowLateSubmissions: !!raw?.allow_late_submissions,
});

const deriveStatus = (raw: RawAssignment, mySubmission?: RawSubmission): Assignment['status'] => {
  if (mySubmission?.status === 'graded') return 'GRADED';
  if (mySubmission?.status === 'submitted') return 'SUBMITTED';
  if (raw.due_date && new Date(raw.due_date) < new Date()) return 'OVERDUE';
  return 'PENDING';
};

const toAssignment = (raw: RawAssignment, studentView: boolean): Assignment => {
  const mySubmission = studentView ? raw.submissions?.[0] : undefined;
  return {
    id: String(raw.id),
    title: raw.title,
    subjectName: raw.subject?.name ?? '',
    dueDate: raw.due_date ?? '',
    status: deriveStatus(raw, mySubmission),
    progress: mySubmission ? 100 : 0,
    grade: mySubmission?.grade,
    type: raw.type,
  };
};

const toSubmission = (raw: RawSubmission): AssignmentSubmission => ({
  submissionId: String(raw.id),
  studentId: raw.student_id,
  studentName: raw.student_name,
  submissionDate: raw.submitted_at,
  grade: raw.grade,
  marksObtained: raw.marks_obtained,
  feedback: raw.feedback,
});

const toAssignmentDetail = (raw: RawAssignment, studentView: boolean): AssignmentDetail => {
  const mySubmission = studentView ? raw.submissions?.[0] : undefined;
  return {
    id: String(raw.id),
    title: raw.title,
    description: raw.description,
    instructions: raw.detailed_instructions,
    subjectName: raw.subject?.name ?? '',
    className: raw.class?.name,
    dueDate: raw.due_date ?? '',
    status: deriveStatus(raw, mySubmission),
    grade: mySubmission?.grade,
    marksObtained: mySubmission?.marks_obtained,
    maxMarks: raw.maximum_marks,
    fileUrl: raw.file_url,
    type: raw.type,
    allowLateSubmissions: !!raw.allow_late_submissions,
    submissions: studentView ? undefined : raw.submissions?.map(toSubmission),
  };
};

export const assignmentApi = {
  async getAssignments(): Promise<AssignmentListResponse> {
    const studentView = isStudent();

    if (studentView) {
      // getStudentAssignmentsAndStats returns { assignments, stats, chart },
      // with flat rows and a server-computed status — not a bare array.
      const response = await client.get<
        ApiResponse<{ assignments: RawStudentAssignmentRow[]; stats: RawStudentStats }>
      >('/api/student/assignments/stats');

      const body = response.data.data;
      const assignments = (body?.assignments ?? []).map(toStudentAssignment);
      const stats = body?.stats;

      return {
        counters: {
          total: stats?.total ?? assignments.length,
          pending: stats?.pending ?? 0,
          submitted: stats?.submitted ?? 0,
          // The stats query hardcodes graded: 0 — it does not distinguish
          // graded from submitted. See INTEGRATION_LOG.md.
          graded: stats?.graded ?? 0,
        },
        assignments,
      };
    }

    // TODO(teacher-service phase): still points at the old gateway path.
    const response = await client.get<ApiResponse<RawAssignment[]>>(
      '/assignments/teacher/list',
    );
    return { assignments: (response.data.data ?? []).map((a) => toAssignment(a, false)) };
  },

  async getAssignmentById(id: string): Promise<AssignmentDetail> {
    const studentView = isStudent();

    if (studentView) {
      const response = await client.get<ApiResponse<RawStudentAssignmentDetail>>(
        `/api/student/assignments/${id}`,
      );
      return toStudentAssignmentDetail(id, response.data.data);
    }

    // TODO(teacher-service phase): still points at the old gateway path.
    const response = await client.get<ApiResponse<RawAssignment>>(
      `/assignments/teacher/${id}`,
    );
    return toAssignmentDetail(response.data.data, false);
  },

  async submitAssignment(id: string, formData: FormData): Promise<SubmitAssignmentResult> {
    // The assignment id travels in the body as `teacherAssignmentId`, not in
    // the path; the file part must be named `assignmentFile`, which the
    // calling screen already does.
    formData.append('teacherAssignmentId', id);

    // submitAssignment responds with { status, message } and, when a file was
    // attached, data.uploadedFile — it never returns the submission row, so
    // there is no submission id to report back.
    await client.post<ApiResponse<unknown>>(
      '/api/student/assignments/submit',
      formData,
      {
        // React Native's native XHR sets the correct multipart boundary;
        // setting this header signals intent while the native layer handles the boundary.
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );

    return {
      assignmentId: id,
      submissionDate: new Date().toISOString(),
      status: 'submitted',
    };
  },

  async createAssignment(data: CreateAssignmentPayload): Promise<AssignmentDetail> {
    const response = await client.post<ApiResponse<RawAssignment>>('/assignments/teacher/create', {
      title: data.title,
      description: data.description,
      detailed_instructions: data.instructions,
      class_id: data.class_id,
      subject_id: data.subject_id,
      due_date: data.due_date,
      allow_late_submissions: data.allow_late_submissions,
    });
    return toAssignmentDetail(response.data.data, false);
  },

  async gradeSubmission(
    submissionId: string,
    data: GradeSubmissionPayload,
  ): Promise<void> {
    await client.post(`/assignments/teacher/submissions/${submissionId}/grade`, data);
  },

  async getAssignmentMetadata(): Promise<AssignmentMetadata> {
    interface RawTeacherClass {
      class?: { id: number; name: string; code: string };
      subject?: { id: number; name: string; code: string };
    }
    const response = await client.get<ApiResponse<RawTeacherClass[]>>('/assignments/teacher/metadata');
    const rows = response.data.data;

    const subjectsById = new Map<string, { id: string; name: string }>();
    const classesById = new Map<string, { id: string; name: string }>();
    for (const row of rows) {
      if (row.subject) subjectsById.set(String(row.subject.id), { id: String(row.subject.id), name: row.subject.name });
      if (row.class) classesById.set(String(row.class.id), { id: String(row.class.id), name: row.class.name });
    }

    return {
      subjects: Array.from(subjectsById.values()),
      classes: Array.from(classesById.values()),
    };
  },
};
