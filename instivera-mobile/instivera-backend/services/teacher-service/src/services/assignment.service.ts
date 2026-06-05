import { Op, WhereOptions } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { getTenantModels } from '../models';

export class AssignmentService {
  // ── Helpers ──────────────────────────────────────────────────────────────

  private async resolveTeacherId(employeeId: string, tenant: string): Promise<number> {
    const { Teacher } = getTenantModels(tenant);
    const teacher: any = await (Teacher as any).findOne({
      where: { employee_id: employeeId },
      attributes: ['id'],
      raw: true,
    });
    if (!teacher) {
      const err: any = new Error('Teacher not found');
      err.status = 404;
      throw err;
    }
    return teacher.id;
  }

  // ── Teacher Assignment CRUD ───────────────────────────────────────────────

  async createAssignment(
    payload: {
      title: string;
      description?: string;
      class_id: number;
      subject_id?: number;
      due_date?: string;
      allow_late_submissions?: boolean;
      detailed_instructions?: string;
      type?: 'Assignment' | 'Homework';
      maximum_marks?: number;
    },
    employeeId: string,
    fileUrl: string | undefined,
    tenant: string
  ) {
    const teacherId = await this.resolveTeacherId(employeeId, tenant);
    const { TeacherAssignment } = getTenantModels(tenant);

    const assignment: any = await (TeacherAssignment as any).create({
      assignment_id: uuidv4(),
      title: payload.title,
      description: payload.description,
      detailed_instructions: payload.detailed_instructions,
      type: payload.type || 'Assignment',
      teacher_id: teacherId,
      class_id: payload.class_id,
      subject_id: payload.subject_id,
      due_date: payload.due_date,
      maximum_marks: payload.maximum_marks || 100,
      allow_late_submissions: payload.allow_late_submissions ? 1 : 0,
      file_url: fileUrl,
      is_active: 1,
    });

    return this.formatAssignment(assignment);
  }

  async listAssignments(
    employeeId: string,
    filters: { class_id?: number; subject_id?: number; due_date?: string },
    tenant: string
  ) {
    const teacherId = await this.resolveTeacherId(employeeId, tenant);
    const { TeacherAssignment, Class, Subject } = getTenantModels(tenant);

    const where: WhereOptions = { teacher_id: teacherId, is_active: 1 };
    if (filters.class_id) (where as any).class_id = filters.class_id;
    if (filters.subject_id) (where as any).subject_id = filters.subject_id;
    if (filters.due_date) (where as any).due_date = filters.due_date;

    const assignments = await (TeacherAssignment as any).findAll({
      where,
      include: [
        { model: Class, as: 'class', attributes: ['id', 'name', 'code'] },
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] },
      ],
      order: [['created_at', 'DESC']],
    });

    return assignments.map((a: any) => this.formatAssignment(a));
  }

  async getAssignmentById(assignmentId: string | number, tenant: string) {
    const { TeacherAssignment, Class, Subject, AssignmentSubmission } = getTenantModels(tenant);

    const where: WhereOptions = isNaN(Number(assignmentId))
      ? { assignment_id: assignmentId }
      : { id: Number(assignmentId) };

    const assignment: any = await (TeacherAssignment as any).findOne({
      where,
      include: [
        { model: Class, as: 'class', attributes: ['id', 'name', 'code'] },
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] },
        { model: AssignmentSubmission, as: 'submissions' },
      ],
    });

    if (!assignment) {
      const err: any = new Error('Assignment not found');
      err.status = 404;
      throw err;
    }

    return {
      ...this.formatAssignment(assignment),
      submissions: (assignment.submissions || []).map((s: any) => this.formatSubmission(s)),
    };
  }

  async updateAssignment(
    assignmentId: string | number,
    payload: Partial<{
      title: string;
      description: string;
      due_date: string;
      allow_late_submissions: boolean;
      detailed_instructions: string;
      type: 'Assignment' | 'Homework';
      maximum_marks: number;
    }>,
    fileUrl: string | undefined,
    tenant: string
  ) {
    const { TeacherAssignment } = getTenantModels(tenant);

    const where: WhereOptions = isNaN(Number(assignmentId))
      ? { assignment_id: assignmentId }
      : { id: Number(assignmentId) };

    const assignment: any = await (TeacherAssignment as any).findOne({ where });
    if (!assignment) {
      const err: any = new Error('Assignment not found');
      err.status = 404;
      throw err;
    }

    const updates: any = {};
    if (payload.title !== undefined) updates.title = payload.title;
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.due_date !== undefined) updates.due_date = payload.due_date;
    if (payload.allow_late_submissions !== undefined)
      updates.allow_late_submissions = payload.allow_late_submissions ? 1 : 0;
    if (payload.detailed_instructions !== undefined)
      updates.detailed_instructions = payload.detailed_instructions;
    if (payload.type !== undefined) updates.type = payload.type;
    if (payload.maximum_marks !== undefined) updates.maximum_marks = payload.maximum_marks;
    if (fileUrl !== undefined) updates.file_url = fileUrl;

    await assignment.update(updates);
    return this.formatAssignment(assignment);
  }

  // ── Submissions ───────────────────────────────────────────────────────────

  async getSubmissionsForAssignment(assignmentId: string | number, tenant: string) {
    const { AssignmentSubmission, TeacherAssignment } = getTenantModels(tenant);

    const assignWhere: WhereOptions = isNaN(Number(assignmentId))
      ? { assignment_id: assignmentId }
      : { id: Number(assignmentId) };

    const assignment: any = await (TeacherAssignment as any).findOne({
      where: assignWhere,
      attributes: ['id'],
      raw: true,
    });
    if (!assignment) {
      const err: any = new Error('Assignment not found');
      err.status = 404;
      throw err;
    }

    const submissions = await (AssignmentSubmission as any).findAll({
      where: { teacher_assignment_id: assignment.id },
      order: [['submitted_at', 'DESC']],
    });

    return submissions.map((s: any) => this.formatSubmission(s));
  }

  async gradeSubmission(
    submissionId: string | number,
    grade: string,
    marksObtained: number,
    feedback: string | undefined,
    tenant: string
  ) {
    const { AssignmentSubmission } = getTenantModels(tenant);

    const where: WhereOptions = isNaN(Number(submissionId))
      ? { submission_id: submissionId }
      : { id: Number(submissionId) };

    const submission: any = await (AssignmentSubmission as any).findOne({ where });
    if (!submission) {
      const err: any = new Error('Submission not found');
      err.status = 404;
      throw err;
    }

    await submission.update({
      grade,
      marks_obtained: marksObtained,
      feedback,
      status: 'graded',
      graded_at: new Date(),
    });

    return this.formatSubmission(submission);
  }

  // ── Metadata for create-form ──────────────────────────────────────────────

  async getMetadata(employeeId: string, tenant: string) {
    const teacherId = await this.resolveTeacherId(employeeId, tenant);
    const { TeacherClass, Class, Subject } = getTenantModels(tenant);

    const assignments = await (TeacherClass as any).findAll({
      where: { teacher_id: teacherId, is_active: 1 },
      include: [
        { model: Class, as: 'class', attributes: ['id', 'name', 'code'] },
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] },
      ],
    });

    const classMap = new Map<number, any>();
    const subjectMap = new Map<number, any>();

    for (const a of assignments) {
      if (a.class && !classMap.has(a.class_id)) {
        classMap.set(a.class_id, { id: a.class.id, name: a.class.name, code: a.class.code });
      }
      if (a.subject && !subjectMap.has(a.subject_id)) {
        subjectMap.set(a.subject_id, { id: a.subject.id, name: a.subject.name, code: a.subject.code });
      }
    }

    return {
      classes: Array.from(classMap.values()),
      subjects: Array.from(subjectMap.values()),
    };
  }

  // ── Formatters ────────────────────────────────────────────────────────────

  private formatAssignment(a: any) {
    return {
      id: a.id,
      assignment_id: a.assignment_id || String(a.id),
      title: a.title,
      description: a.description || null,
      detailed_instructions: a.detailed_instructions || null,
      type: a.type || 'Assignment',
      teacher_id: a.teacher_id,
      class_id: a.class_id,
      subject_id: a.subject_id || null,
      due_date: a.due_date || null,
      maximum_marks: a.maximum_marks || 100,
      allow_late_submissions: Boolean(a.allow_late_submissions),
      file_url: a.file_url || null,
      is_active: a.is_active,
      class: a.class ? { id: a.class.id, name: a.class.name } : null,
      subject: a.subject ? { id: a.subject.id, name: a.subject.name } : null,
      created_at: a.created_at,
    };
  }

  private formatSubmission(s: any) {
    return {
      id: s.id,
      submission_id: s.submission_id || String(s.id),
      teacher_assignment_id: s.teacher_assignment_id,
      student_id: s.student_id,
      student_name: s.student_name || null,
      file_url: s.file_url || null,
      submission_text: s.submission_text || null,
      submitted_at: s.submitted_at || null,
      marks_obtained: s.marks_obtained || null,
      grade: s.grade || null,
      feedback: s.feedback || null,
      is_late_submission: Boolean(s.is_late_submission),
      status: s.status || 'not_submitted',
      graded_at: s.graded_at || null,
    };
  }
}

export default new AssignmentService();
