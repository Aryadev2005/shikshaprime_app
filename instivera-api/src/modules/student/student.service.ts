import { Op } from 'sequelize';
import { getTenantModels } from '../../models';
import { AppError } from '../../utils/appError';

export class StudentService {
  static async getProfile(studentId: string, tenant: string) {
    const { Student, Department } = getTenantModels(tenant);
    const student = await Student.findOne({
      where: { student_id: studentId },
      include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'code'] }],
    });
    if (!student) throw AppError.notFound('Student profile not found');
    return student;
  }

  static async searchStudents(query: string, tenant: string) {
    const { Student } = getTenantModels(tenant);
    const pattern = `%${query}%`;
    return Student.findAll({
      where: {
        [Op.or]: [
          { student_id: { [Op.like]: pattern } },
          { student_name: { [Op.like]: pattern } },
          { first_name: { [Op.like]: pattern } },
          { last_name: { [Op.like]: pattern } },
          { email: { [Op.like]: pattern } },
          { roll_number: { [Op.like]: pattern } },
        ],
      },
      attributes: ['id', 'student_id', 'student_name', 'first_name', 'last_name', 'email', 'roll_number', 'class_id'],
      limit: 20,
    });
  }
}
