import { getTenantModels } from '../../models';
import { AppError } from '../../utils/appError';

export class ProfileService {
  static async getProfile(email: string, role: string, tenant: string) {
    const { Teacher, Student, Department } = getTenantModels(tenant);

    if (role === 'teacher' || role === 'admin') {
      const teacher = await Teacher.findOne({
        where: { email, is_active: 1 },
        include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'code'] }],
      });
      if (!teacher) throw AppError.notFound('Teacher profile not found');
      return { role: 'teacher', profile: teacher };
    }

    if (role === 'student') {
      const student = await Student.findOne({
        where: { email },
        include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'code'] }],
      });
      if (!student) throw AppError.notFound('Student profile not found');
      return { role: 'student', profile: student };
    }

    throw AppError.badRequest('Unknown role');
  }
}
