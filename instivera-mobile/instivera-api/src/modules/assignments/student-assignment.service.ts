import { getTenantModels } from '../../models';
import { AppError } from '../../utils/appError';

export class StudentAssignmentService {
  static async listMyAssignments(studentId: string, tenant: string, filters: Record<string, any>) {
    const { TeacherAssignment, AssignmentSubmission, Student, SchoolClass: _Class, Subject } = getTenantModels(tenant) as any;

    // Resolve student's class_id if not provided
    let classId = filters.class_id;
    if (!classId) {
      const student = await Student.findOne({ where: { student_id: studentId } });
      classId = student?.class_id;
    }

    const where: Record<string, any> = { is_active: 1 };
    if (classId) where.class_id = classId;
    if (filters.subject_id) where.subject_id = filters.subject_id;

    const assignments = await TeacherAssignment.findAll({
      where,
      include: [
        { model: _Class, as: 'class', attributes: ['id', 'name', 'code'] },
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] },
        {
          model: AssignmentSubmission,
          as: 'submissions',
          where: { student_id: studentId },
          required: false,
          attributes: ['id', 'status', 'marks_obtained', 'grade', 'submitted_at'],
        },
      ],
      order: [['due_date', 'DESC']],
    });

    return assignments;
  }

  static async getAssignmentById(assignmentId: number, studentId: string, tenant: string) {
    const { TeacherAssignment, AssignmentSubmission, Subject } = getTenantModels(tenant) as any;
    const assignment = await TeacherAssignment.findByPk(assignmentId, {
      include: [
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] },
        {
          model: AssignmentSubmission, as: 'submissions',
          where: { student_id: studentId }, required: false,
        },
      ],
    });
    if (!assignment) throw AppError.notFound('Assignment not found');
    return assignment;
  }

  static async submitAssignment(
    assignmentId: number,
    studentId: string,
    submissionText: string | undefined,
    fileUrl: string | undefined,
    tenant: string,
  ) {
    const { TeacherAssignment, AssignmentSubmission } = getTenantModels(tenant);

    const assignment = await TeacherAssignment.findByPk(assignmentId);
    if (!assignment) throw AppError.notFound('Assignment not found');

    const isLate = assignment.due_date ? new Date() > new Date(assignment.due_date) : false;
    if (isLate && !assignment.allow_late_submissions) {
      throw AppError.badRequest('Late submissions are not allowed for this assignment');
    }

    const [submission, created] = await AssignmentSubmission.upsert({
      teacher_assignment_id: assignmentId,
      student_id: studentId,
      submission_text: submissionText,
      file_url: fileUrl,
      submitted_at: new Date(),
      status: 'submitted',
      is_late_submission: isLate ? 1 : 0,
    } as any);

    return { submission, created };
  }
}
