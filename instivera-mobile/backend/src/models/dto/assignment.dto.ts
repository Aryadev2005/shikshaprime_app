import {
  UpstreamAssignment,
  UpstreamSubmission,
  UpstreamStudentStats,
  MobileAssignment,
  MobileAssignmentList,
  MobileAssignmentDetail,
  MobileSubmission,
} from '../../types/assignment.types';

const progressFromStatus = (status: string): number => {
  switch (status) {
    case 'GRADED':
      return 100;
    case 'SUBMITTED':
      return 75;
    default:
      return 0;
  }
};

const toMobileAssignment = (a: UpstreamAssignment): MobileAssignment => ({
  id: a.id,
  title: a.title,
  subjectName: a.subject_name ?? '',
  dueDate: a.due_date,
  status: a.status,
  progress: progressFromStatus(a.status),
  grade: a.grade,
  type: a.assignment_type,
});

const toMobileSubmission = (s: UpstreamSubmission): MobileSubmission => ({
  submissionId: s.submission_id,
  studentId: s.student_id,
  studentName: s.student_name,
  submissionDate: s.submission_date,
  grade: s.grade,
  marksObtained: s.marks_obtained,
  feedback: s.feedback,
});

export const toMobileAssignmentList = (
  data: { stats: UpstreamStudentStats; assignments: UpstreamAssignment[] } | UpstreamAssignment[],
  role: string,
): MobileAssignmentList => {
  if (role === 'student') {
    const d = data as { stats: UpstreamStudentStats; assignments: UpstreamAssignment[] };
    return {
      counters: d.stats,
      assignments: d.assignments.map(toMobileAssignment),
    };
  }
  const list = data as UpstreamAssignment[];
  return { assignments: list.map(toMobileAssignment) };
};

export const toMobileAssignmentDetail = (
  a: UpstreamAssignment & { submissions?: UpstreamSubmission[] },
): MobileAssignmentDetail => ({
  id: a.id,
  title: a.title,
  description: a.description,
  instructions: a.instructions,
  subjectName: a.subject_name ?? '',
  className: a.class_name,
  dueDate: a.due_date,
  status: a.status,
  grade: a.grade,
  marksObtained: a.marks_obtained,
  maxMarks: a.max_marks,
  fileUrl: a.file_url,
  type: a.assignment_type,
  allowLateSubmissions: a.allow_late_submissions,
  submissions: a.submissions?.map(toMobileSubmission),
});
