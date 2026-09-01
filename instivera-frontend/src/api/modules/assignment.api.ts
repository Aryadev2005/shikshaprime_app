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
// Distinct from `!isStudent()`: admins reach the same screens, but the
// submission/grading routes are gated `requireRole('teacher')` server-side.
const isTeacher = (): boolean => useAuthStore.getState().role === 'teacher';

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

// ── teacher-service shapes ─────────────────────────────────────────
// `getFacultyAssignments` / `getAssignmentById` return flat `teacher_assignments`
// rows joined to subject/program/class names. Note `submissions` is a COUNT,
// not a list — the submission rows come from a separate endpoint.

interface RawTeacherAssignmentRow {
  id: number;
  title: string;
  description?: string;
  detailed_instructions?: string;
  type?: string;
  due_date?: string;
  due_time?: string;
  maximum_marks?: number;
  allow_late_submissions?: number | boolean;
  subject_id?: number;
  subject_name?: string | null;
  class_id?: number;
  class_name?: string | null;
  program_name?: string | null;
  submissions?: number;
  attachments?: Array<{ id: number; fileName: string; fileUrl: string | null }>;
}

interface RawTeacherAssignmentList {
  assignments: RawTeacherAssignmentRow[];
  total: number;
  page: number;
  limit: number;
}

interface RawTeacherSubmissionRow {
  assignment_id: number;
  submission_id: number;
  student_pk?: number;
  student_id?: string;
  student_name?: string;
  roll_number?: string;
  submitted_at?: string;
  file_url?: string;
  marks_obtained?: number;
  grade?: string;
  feedback?: string;
  status?: string;
}

const teacherStatus = (dueDate?: string): Assignment['status'] =>
  dueDate && new Date(dueDate) < new Date() ? 'OVERDUE' : 'PENDING';

// The teacher list carries no per-assignment completion ratio (only a raw
// submission count with no class size to divide by), so `progress` stays 0.
const toTeacherAssignment = (raw: RawTeacherAssignmentRow): Assignment => ({
  id: String(raw.id),
  title: raw.title,
  subjectName: raw.subject_name ?? '',
  dueDate: raw.due_date ?? '',
  status: teacherStatus(raw.due_date),
  progress: 0,
  type: raw.type,
});

const toTeacherSubmission = (raw: RawTeacherSubmissionRow): AssignmentSubmission => ({
  submissionId: String(raw.submission_id),
  studentId: raw.student_id ?? String(raw.student_pk ?? ''),
  studentName: raw.student_name?.replace(/\s+/g, ' ').trim(),
  submissionDate: raw.submitted_at,
  grade: raw.grade,
  marksObtained: raw.marks_obtained,
  feedback: raw.feedback,
});

const toTeacherAssignmentDetail = (
  raw: RawTeacherAssignmentRow,
  submissions?: AssignmentSubmission[],
): AssignmentDetail => ({
  id: String(raw.id),
  title: raw.title,
  description: raw.description,
  instructions: raw.detailed_instructions,
  subjectName: raw.subject_name ?? '',
  className: raw.class_name ?? undefined,
  dueDate: raw.due_date ?? '',
  status: teacherStatus(raw.due_date),
  maxMarks: raw.maximum_marks,
  fileUrl: raw.attachments?.[0]?.fileUrl ?? undefined,
  type: raw.type,
  allowLateSubmissions: !!raw.allow_late_submissions,
  submissions,
});

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

    // getFacultyAssignments is paginated (server default limit 10) and derives
    // the faculty from the token. There is no pagination UI, so one large page
    // is requested; `total` is ignored beyond that. It returns no counters —
    // the teacher list has no pending/submitted/graded notion server-side.
    const response = await client.get<ApiResponse<RawTeacherAssignmentList>>(
      '/api/teacher/assignments',
      { params: { limit: 100, status: 'active' } },
    );
    const rows = response.data.data?.assignments ?? [];
    return { assignments: rows.map(toTeacherAssignment) };
  },

  async getAssignmentById(id: string): Promise<AssignmentDetail> {
    const studentView = isStudent();

    if (studentView) {
      const response = await client.get<ApiResponse<RawStudentAssignmentDetail>>(
        `/api/student/assignments/${id}`,
      );
      return toStudentAssignmentDetail(id, response.data.data);
    }

    const response = await client.get<ApiResponse<RawTeacherAssignmentRow>>(
      `/api/teacher/assignments/${id}`,
    );

    // The assignment row carries only a submission COUNT. The submission rows
    // live on `/assignments/submitted`, which is teacher-scoped but has no
    // assignment_id filter, so it is fetched and filtered client-side. Skipped
    // for non-teachers (admins) because that route is `requireRole('teacher')`.
    let submissions: AssignmentSubmission[] | undefined;
    if (isTeacher()) {
      const submitted = await client.get<ApiResponse<{ assignments: RawTeacherSubmissionRow[] }>>(
        '/api/teacher/assignments/submitted',
        { params: { limit: 200 } },
      );
      submissions = (submitted.data.data?.assignments ?? [])
        .filter((row) => String(row.assignment_id) === String(id))
        .map(toTeacherSubmission);
    }

    return toTeacherAssignmentDetail(response.data.data, submissions);
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

  // Returns only the new assignment's id: createAssignment responds with
  // `data: <insertId>`, not the created row.
  async createAssignment(data: CreateAssignmentPayload): Promise<{ id: string }> {
    const response = await client.post<ApiResponse<number>>('/api/teacher/assignments', {
      title: data.title,
      description: data.description,
      detailed_instructions: data.instructions,
      class_id: data.class_id,
      subject_id: data.subject_id,
      due_date: data.due_date,
      // The controller 400s without `type` and `due_time`, neither of which
      // CreateAssignmentScreen collects. See INTEGRATION_LOG.md — the form
      // needs both fields; these are the request defaults until it has them.
      type: data.type ?? 'Assignment',
      due_time: data.due_time ?? '23:59:00',
      allow_late_submissions: data.allow_late_submissions,
    });
    return { id: String(response.data.data) };
  },

  async gradeSubmission(
    submissionId: string,
    data: GradeSubmissionPayload,
  ): Promise<void> {
    // PUT, not POST. The backend derives the letter grade from marks_obtained
    // itself and ignores any `grade` sent, so only marks and feedback go up.
    await client.put(`/api/teacher/submissions/${submissionId}/grade`, {
      marks_obtained: data.marks_obtained,
      feedback: data.feedback,
    });
  },

  // There is no combined metadata endpoint: teacher-service exposes one route
  // per lookup under /api/teacher/metadata/*. Only the two the create form
  // needs are fetched.
  async getAssignmentMetadata(): Promise<AssignmentMetadata> {
    interface RawLookupRow {
      id: number;
      name: string;
      code?: string;
    }

    const [subjects, classes] = await Promise.all([
      client.get<ApiResponse<RawLookupRow[]>>('/api/teacher/metadata/subjects'),
      client.get<ApiResponse<RawLookupRow[]>>('/api/teacher/metadata/classes'),
    ]);

    return {
      subjects: (subjects.data.data ?? []).map((s) => ({ id: String(s.id), name: s.name })),
      classes: (classes.data.data ?? []).map((c) => ({ id: String(c.id), name: c.name })),
    };
  },
};
