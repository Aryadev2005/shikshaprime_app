import { AppError } from '../utils/appError';
import { getTenantSequelize } from '../db';
import { getTenantModels } from '../models';

export class ProfileService {
  /**
   * Get user profile based on role
   * For teachers: returns teacher info
   * For students: returns student info
   */
  async getProfile(email: string, role: string, tenant: string) {
    try {
      const sequelize = getTenantSequelize(tenant);
      const models = getTenantModels(sequelize);

      if (role === 'teacher') {
        const teacher = await models.Teacher.findOne({
          where: { email },
          raw: false,
        });

        if (!teacher) {
          throw AppError.notFound('Teacher profile not found');
        }

        return {
          type: 'teacher',
          first_name: teacher.first_name,
          last_name: teacher.last_name,
          email: teacher.email,
          phone: teacher.phone,
          department_id: teacher.department_id,
          designation: teacher.designation,
          profile_picture: teacher.profile_picture,
          employee_id: teacher.employee_id,
        };
      } else if (role === 'student') {
        const student = await models.Student.findOne({
          where: { email },
          raw: false,
        });

        if (!student) {
          throw AppError.notFound('Student profile not found');
        }

        return {
          type: 'student',
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email,
          phone: student.phone,
          class_id: student.class_id,
          program_id: student.program_id,
          roll_number: student.roll_number,
          profile_picture: student.profile_picture,
        };
      } else {
        throw AppError.badRequest('Invalid user role');
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to fetch profile');
    }
  }
}
