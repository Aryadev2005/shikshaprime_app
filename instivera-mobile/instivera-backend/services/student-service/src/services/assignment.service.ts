import { Op, WhereOptions } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { getTenantModels } from '../models';

export class AssignmentService {
  async listMyAssignments(
    studentId: string,
    filters: { class_id?: number; subject_id?: number; status?: string },
    tenant: string
  ) {
    const { TeacherAssignment, AssignmentSubmission, Student } = getTenantModels(tenant);

    // Resolve student's class_id if not passed
    let classId = filters.class_id;
    if (!classId) {
      const student: any = await (Student as any).findOne({
        where: { student_id: studentId },
        attributes: ['class_id'],
        raw: true,
      });
      if (student?.class_id) classId = student.class_id;
    }

    const assignWhere: WhereOptions = { is_active: 1 };
    if (classId) (assignWhere as any).class_id = classId;
    if (filters.subject_id) (assignWhere as any).subject_id = filters.subject_id;

    const assignments: any[] = await (TeacherAssignment as any).findAll({
      where: assignWhere,
      order: [['due_date', 'ASC']],
    });

    if (assignments.length === 0) return { assignments: [], stats: this.emptyStats() };

    const assignmentIds = assignments.map((a: any) => a.id);

    // Fetch this student's submissions for all these assignments at once
    const submissions: any[] = await (AssignmentSubmission as any).findAll({
      where: {
        teacher_assignment_id: { [Op.in]: assignmentIds },
        student_id: studentId,
      },
      raw: true,
    });

    const submissionMap = new Map<number, any>();
    for (const s of submissions) {
      submissionMap.set(s.teacher_assignment_id, s);
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const result = assignments.map((a: any) => {
      const sub = submissionMap.get(a.id);
      const dueDate = a.due_date ? new Date(a.due_date) : null;
      const isOverdue = dueDate ? dueDate < now : false;

      let status = 'PENDING';
      if (sub?.status === 'graded') status = 'GRADED';
      else if (sub?.status === 'submitted') status = 'SUBMITTED';
      else if (isOverdue && !sub) status = 'OVERDUE';

      return {
        id: a.id,
        assignment_id: a.assignment_id || String(a.id),
        title: a.title,
        description: a.description || null,
        type: a.type || 'Assignment',
        class_id: a.class_id,
        subject_id: a.subject_id,
        due_date: a.due_date || null,
        maximum_marks: a.maximum_marks || 100,
        allow_late_submissions: Boolean(a.allow_late_submissions),
        file_url: a.file_url || null,
        status,
        submission: sub
          ? {
              submission_id: sub.submission_id || String(sub.id),
              submitted_at: sub.submitted_at,
              grade: sub.grade,
              marks_obtained: sub.marks_obtained,
              feedback: sub.feedback,
              status: sub.status,
              file_url: sub.file_url,
            }
          : null,
        created_at: a.created_at,
      };
    });

    // Filter by status if requested
    const filtered = filters.status
      ? result.filter((a) => a.status === filters.status!.toUpperCase())
      : result;

    return { assignments: filtered, stats: this.computeStats(result) };
  }

  async getAssignmentById(assignmentId: string | number, studentId: string, tenant: string) {
    const { TeacherAssignment, AssignmentSubmission } = getTenantModels(tenant);

    const where: WhereOptions = isNaN(Number(assignmentId))
      ? { assignment_id: assignmentId }
      : { id: Number(assignmentId) };

    const assignment: any = await (TeacherAssignment as any).findOne({ where });
    if (!assignment) {
      const err: any = new Error('Assignment not found');
      err.status = 404;
      throw err;
    }

    const submission: any = await (AssignmentSubmission as any).findOne({
      where: { teacher_assignment_id: assignment.id, student_id: studentId },
    });

    return {
      id: assignment.id,
      assignment_id: assignment.assignment_id || String(assignment.id),
      title: assignment.title,
      description: assignment.description || null,
      detailed_instructions: assignment.detailed_instructions || null,
      type: assignment.type || 'Assignment',
      class_id: assignment.class_id,
      subject_id: assignment.subject_id,
      due_date: assignment.due_date || null,
      maximum_marks: assignment.maximum_marks || 100,
      allow_late_submissions: Boolean(assignment.allow_late_submissions),
      file_url: assignment.file_url || null,
      created_at: assignment.created_at,
      submission: submission
        ? {
            submission_id: submission.submission_id || String(submission.id),
            submitted_at: submission.submitted_at,
            grade: submission.grade,
            marks_obtained: submission.marks_obtained,
            feedback: submission.feedback,
            status: submission.status,
            file_url: submission.file_url,
          }
        : null,
    };
  }

  async submitAssignment(
    payload: { assignmentId: string | number; studentId: string; fileUrl?: string; submissionText?: string },
    tenant: string
  ) {
    const { TeacherAssignment, AssignmentSubmission, Student } = getTenantModels(tenant);

    const assignWhere: WhereOptions = isNaN(Number(payload.assignmentId))
      ? { assignment_id: payload.assignmentId }
      : { id: Number(payload.assignmentId) };

    const assignment: any = await (TeacherAssignment as any).findOne({ where: assignWhere });
    if (!assignment) {
      const err: any = new Error('Assignment not found');
      err.status = 404;
      throw err;
    }

    // Check for late submission
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
    const isLate = dueDate ? dueDate < now : false;

    if (isLate && !assignment.allow_late_submissions) {
      const err: any = new Error('Late submissions are not allowed for this assignment');
      err.status = 400;
      throw err;
    }

    // Get student name
    const student: any = await (Student as any).findOne({
      where: { student_id: payload.studentId },
      attributes: ['student_name'],
      raw: true,
    });

    // Upsert: update if already submitted
    const existing: any = await (AssignmentSubmission as any).findOne({
      where: {
        teacher_assignment_id: assignment.id,
        student_id: payload.studentId,
      },
    });

    if (existing) {
      await existing.update({
        file_url: payload.fileUrl || existing.file_url,
        submission_text: payload.submissionText || existing.submission_text,
        submitted_at: new Date(),
        status: 'submitted',
        is_late_submission: isLate ? 1 : 0,
      });
      return {
        submission_id: existing.submission_id || String(existing.id),
        assignment_id: assignment.assignment_id || String(assignment.id),
        submission_date: existing.submitted_at,
        status: 'submitted',
      };
    }

    const submission: any = await (AssignmentSubmission as any).create({
      submission_id: uuidv4(),
      teacher_assignment_id: assignment.id,
      student_id: payload.studentId,
      student_name: student?.student_name || null,
      file_url: payload.fileUrl,
      submission_text: payload.submissionText,
      submitted_at: new Date(),
      status: 'submitted',
      is_late_submission: isLate ? 1 : 0,
    });

    return {
      submission_id: submission.submission_id || String(submission.id),
      assignment_id: assignment.assignment_id || String(assignment.id),
      submission_date: submission.submitted_at,
      status: 'submitted',
    };
  }

  async getAssignmentStats(studentId: string, tenant: string) {
    const { AssignmentSubmission } = getTenantModels(tenant);

    const submissions: any[] = await (AssignmentSubmission as any).findAll({
      where: { student_id: studentId },
      attributes: ['status'],
      raw: true,
    });

    const stats = {
      submitted: 0,
      graded: 0,
      total: submissions.length,
    };

    for (const s of submissions) {
      if (s.status === 'submitted') stats.submitted++;
      else if (s.status === 'graded') stats.graded++;
    }

    return stats;
  }

  private emptyStats() {
    return { total: 0, pending: 0, submitted: 0, graded: 0, overdue: 0 };
  }

  private computeStats(assignments: any[]) {
    const stats = { total: assignments.length, pending: 0, submitted: 0, graded: 0, overdue: 0 };
    for (const a of assignments) {
      if (a.status === 'PENDING') stats.pending++;
      else if (a.status === 'SUBMITTED') stats.submitted++;
      else if (a.status === 'GRADED') stats.graded++;
      else if (a.status === 'OVERDUE') stats.overdue++;
    }
    return stats;
  }
}

export default new AssignmentService();
