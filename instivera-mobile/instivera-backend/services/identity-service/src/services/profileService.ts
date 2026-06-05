import { AppError } from '../utils/appError';
import { getTenantSequelize } from '../db';
import { getTenantModels } from '../models';

export class ProfileService {
  /**
   * Get user profile based on role
   * For teachers: returns teacher info
   * For students: returns student info
   */
  async getProfile(userId: number, role: string, tenant: string) {
    try {
      const sequelize = getTenantSequelize(tenant);
      const models = getTenantModels(sequelize);

      if (role === 'teacher') {
        // For teachers, join with User and Teacher tables (simplified for Phase 1)
        const teacher = await models.Teacher.findOne({
          where: {}, // In production, would join with user_id
          raw: false,
        });

        if (!teacher) {
          throw AppError.notFound('Teacher profile not found');
        }

        return {
          user_id: userId,
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
        // For students
        const student = await models.Student.findOne({
          where: {}, // In production, would join with user_id
          raw: false,
        });

        if (!student) {
          throw AppError.notFound('Student profile not found');
        }

        return {
          user_id: userId,
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
