import { getTenantModels } from '../models';
import { StudentProfile } from '../types/student.types';

export class StudentService {
  async getProfile(studentId: string, tenant: string): Promise<StudentProfile> {
    const { Student, Department } = getTenantModels(tenant);

    const student = await Student.findOne({
      where: { student_id: studentId },
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code']
        }
      ]
    }) as any;

    if (!student) {
      throw new Error('Student not found');
    }

    return {
      id: student.id,
      student_id: student.student_id,
      student_name: student.student_name,
      roll_number: student.roll_number,
      email: student.email,
      mobile: student.mobile,
      department_id: student.department_id,
      department: student.department ? {
        id: student.department.id,
        name: student.department.name,
        code: student.department.code
      } : undefined
    };
  }
}
