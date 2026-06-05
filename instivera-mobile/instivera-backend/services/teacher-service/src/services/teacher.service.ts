import { getTenantModels } from '../models';

export class TeacherService {
  async getProfile(employeeId: string, tenant: string) {
    const { Teacher, Department } = getTenantModels(tenant);

    const teacher = await (Teacher as any).findOne({
      where: { employee_id: employeeId },
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code'],
        },
      ],
    });

    if (!teacher) {
      const err: any = new Error('Teacher not found');
      err.status = 404;
      throw err;
    }

    return {
      id: teacher.id,
      employee_id: teacher.employee_id,
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      full_name: `${teacher.first_name} ${teacher.last_name}`,
      designation: teacher.designation,
      department_id: teacher.department_id,
      department: teacher.department
        ? { id: teacher.department.id, name: teacher.department.name, code: teacher.department.code }
        : undefined,
      qualification: teacher.qualification,
      experience_years: teacher.experience_years,
      phone: teacher.phone,
      email: teacher.email,
      date_of_joining: teacher.date_of_joining,
      is_active: teacher.is_active,
    };
  }

  async getMyClasses(employeeId: string, tenant: string) {
    const { Teacher, TeacherClass, Class, Subject } = getTenantModels(tenant);

    const teacher = await (Teacher as any).findOne({
      where: { employee_id: employeeId },
      attributes: ['id', 'employee_id'],
    });

    if (!teacher) {
      const err: any = new Error('Teacher not found');
      err.status = 404;
      throw err;
    }

    const assignments = await (TeacherClass as any).findAll({
      where: { teacher_id: teacher.id, is_active: 1 },
      include: [
        { model: Class, as: 'class', attributes: ['id', 'name', 'code'] },
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] },
      ],
    });

    return assignments.map((a: any) => ({
      id: a.id,
      class_id: a.class_id,
      subject_id: a.subject_id,
      program_id: a.program_id,
      academic_year_id: a.academic_year_id,
      class: a.class ? { id: a.class.id, name: a.class.name, code: a.class.code } : null,
      subject: a.subject ? { id: a.subject.id, name: a.subject.name, code: a.subject.code } : null,
    }));
  }
}

export default new TeacherService();
