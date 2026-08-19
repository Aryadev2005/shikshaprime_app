import { getTenantModels } from '../../models';
import { AppError } from '../../utils/appError';
import { TeacherService } from '../teacher/teacher.service';
import { fileUrl } from '../../middleware/upload.middleware';

// teacher_assignments has no file_url column — attachments live in the separate
// teacher_assignment_attachments table instead.
async function attachFileIfPresent(
  assignmentId: number,
  file: Express.Multer.File | undefined,
  tenant: string,
): Promise<void> {
  if (!file) return;
  const { TeacherAssignmentAttachment } = getTenantModels(tenant);
  await TeacherAssignmentAttachment.create({
    teacher_assignment_id: assignmentId,
    file_name: file.originalname,
    file_url: fileUrl(file)!,
    file_size: file.size,
    file_type: file.mimetype,
  });
}

export class TeacherAssignmentService {
  static async listAssignments(teacherId: number, tenant: string, filters: Record<string, any>) {
    const { TeacherAssignment, SchoolClass: _Class, Subject, AssignmentSubmission } = getTenantModels(tenant) as any;
    const where: Record<string, any> = { teacher_id: teacherId, is_active: 1 };
    if (filters.class_id) where.class_id = filters.class_id;
    if (filters.subject_id) where.subject_id = filters.subject_id;

    return TeacherAssignment.findAll({
      where,
      include: [
        { model: _Class, as: 'class', attributes: ['id', 'name', 'code'] },
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  static async createAssignment(teacherId: number, data: Record<string, any>, tenant: string, file?: Express.Multer.File) {
    const { TeacherAssignment } = getTenantModels(tenant);
    const assignment = await TeacherAssignment.create({
      ...data,
      teacher_id: teacherId,
      is_active: 1,
    } as any);
    await attachFileIfPresent(assignment.id, file, tenant);
    return assignment;
  }

  static async getAssignmentById(assignmentId: number, teacherId: number, tenant: string) {
    const { TeacherAssignment, AssignmentSubmission, TeacherAssignmentAttachment } = getTenantModels(tenant) as any;
    const assignment = await TeacherAssignment.findOne({
      where: { id: assignmentId, teacher_id: teacherId },
      include: [
        { model: AssignmentSubmission, as: 'submissions' },
        { model: TeacherAssignmentAttachment, as: 'attachments' },
      ],
    });
    if (!assignment) throw AppError.notFound('Assignment not found');
    return assignment;
  }

  static async updateAssignment(assignmentId: number, teacherId: number, data: Record<string, any>, tenant: string, file?: Express.Multer.File) {
    const { TeacherAssignment } = getTenantModels(tenant);
    const assignment = await TeacherAssignment.findOne({ where: { id: assignmentId, teacher_id: teacherId } });
    if (!assignment) throw AppError.notFound('Assignment not found');
    await assignment.update(data);
    await attachFileIfPresent(assignmentId, file, tenant);
    return assignment;
  }

  static async gradeSubmission(submissionId: number, grade: Record<string, any>, tenant: string) {
    const { AssignmentSubmission } = getTenantModels(tenant);
    const submission = await AssignmentSubmission.findByPk(submissionId);
    if (!submission) throw AppError.notFound('Submission not found');
    await submission.update({ ...grade, status: 'graded', graded_at: new Date() });
    return submission;
  }

  static async getSubmissions(assignmentId: number, teacherId: number, tenant: string) {
    const { TeacherAssignment, AssignmentSubmission } = getTenantModels(tenant) as any;
    const assignment = await TeacherAssignment.findOne({ where: { id: assignmentId, teacher_id: teacherId } });
    if (!assignment) throw AppError.notFound('Assignment not found');
    return AssignmentSubmission.findAll({ where: { teacher_assignment_id: assignmentId }, order: [['submitted_at', 'DESC']] });
  }

  static async getMetadata(teacherId: number, tenant: string) {
    const { TeacherClass, SchoolClass: _Class, Subject } = getTenantModels(tenant) as any;
    const classes = await TeacherClass.findAll({
      where: { teacher_id: teacherId, is_active: 1 },
      include: [
        { model: _Class, as: 'class', attributes: ['id', 'name', 'code'] },
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] },
      ],
    });
    return classes;
  }
}
