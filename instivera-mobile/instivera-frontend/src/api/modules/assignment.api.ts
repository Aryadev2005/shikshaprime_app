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

const isStudent = (): boolean => useAuthStore.getState().user?.role === 'student';

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
    const path = studentView ? '/assignments/student/list' : '/assignments/teacher/list';
    const response = await client.get<ApiResponse<RawAssignment[]>>(path);
    const raw = response.data.data;
    const assignments = raw.map((a) => toAssignment(a, studentView));

    if (!studentView) return { assignments };

    const counters = {
      total: assignments.length,
      pending: assignments.filter((a) => a.status === 'PENDING').length,
      submitted: assignments.filter((a) => a.status === 'SUBMITTED').length,
      graded: assignments.filter((a) => a.status === 'GRADED').length,
    };
    return { counters, assignments };
  },

  async getAssignmentById(id: string): Promise<AssignmentDetail> {
    const studentView = isStudent();
    const path = studentView ? `/assignments/student/${id}` : `/assignments/teacher/${id}`;
    const response = await client.get<ApiResponse<RawAssignment>>(path);
    return toAssignmentDetail(response.data.data, studentView);
  },

  async submitAssignment(id: string, formData: FormData): Promise<SubmitAssignmentResult> {
    const response = await client.post<ApiResponse<{ submission: RawSubmission; created: boolean }>>(
      `/assignments/student/${id}/submit`,
      formData,
      {
        // React Native's native XHR sets the correct multipart boundary;
        // setting this header signals intent while the native layer handles the boundary.
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    const { submission } = response.data.data;
    return {
      submissionId: String(submission.id),
      assignmentId: id,
      submissionDate: submission.submitted_at ?? new Date().toISOString(),
      status: submission.status ?? 'submitted',
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
