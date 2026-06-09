import { Op } from 'sequelize';
import { getTenantModels } from '../../models';
import { AppError } from '../../utils/appError';

const SLOT_TIMES: Record<string, string> = {
  '1': '08:00 - 09:00', '2': '09:00 - 10:00', '3': '10:00 - 11:00',
  '4': '11:00 - 12:00', '5': '12:00 - 13:00', '6': '13:00 - 14:00',
  '7': '14:00 - 15:00', '8': '15:00 - 16:00',
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export class TeacherService {
  static async resolveTeacherId(userCode: string, tenant: string): Promise<number> {
    const { Teacher } = getTenantModels(tenant);
    const teacher = await Teacher.findOne({ where: { employee_id: userCode } });
    if (!teacher) throw AppError.notFound('Teacher record not found');
    return teacher.id;
  }

  static async getProfile(employeeId: string, tenant: string) {
    const { Teacher, Department } = getTenantModels(tenant);
    const teacher = await Teacher.findOne({
      where: { employee_id: employeeId },
      include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'code'] }],
    });
    if (!teacher) throw AppError.notFound('Teacher profile not found');
    return teacher;
  }

  static async getMyClasses(teacherId: number, tenant: string) {
    const { TeacherClass, SchoolClass: _Class, Subject } = getTenantModels(tenant) as any;
    return TeacherClass.findAll({
      where: { teacher_id: teacherId, is_active: 1 },
      include: [
        { model: _Class, as: 'class', attributes: ['id', 'name', 'code'] },
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] },
      ],
    });
  }

  static async getTimetable(teacherId: number, tenant: string) {
    const { TeacherClass, SchoolClass: _Class, Subject } = getTenantModels(tenant) as any;
    const classes = await TeacherClass.findAll({
      where: { teacher_id: teacherId, is_active: 1 },
      include: [
        { model: _Class, as: 'class', attributes: ['id', 'name', 'code'] },
        { model: Subject, as: 'subject', attributes: ['id', 'name', 'code'] },
      ],
    });

    // Build simple timetable from class list (slot/day from id mod)
    return classes.map((tc: any, i: number) => ({
      ...tc.toJSON(),
      day: DAYS[i % DAYS.length],
      time_slot: SLOT_TIMES[String((i % 8) + 1)],
    }));
  }

  static async searchTeachers(query: string, tenant: string) {
    const { Teacher } = getTenantModels(tenant);
    const pattern = `%${query}%`;
    return Teacher.findAll({
      where: {
        [Op.or]: [
          { employee_id: { [Op.like]: pattern } },
          { first_name: { [Op.like]: pattern } },
          { last_name: { [Op.like]: pattern } },
          { email: { [Op.like]: pattern } },
        ],
      },
      attributes: ['id', 'employee_id', 'first_name', 'last_name', 'email', 'designation', 'department_id'],
      limit: 20,
    });
  }
}
