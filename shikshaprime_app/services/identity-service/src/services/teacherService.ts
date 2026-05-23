import { QueryTypes } from 'sequelize';
import { AppError } from '../utils/appError';
import { getTenantModels } from '../models';
import { getTenantSequelize } from '../server';

export class TeacherService {
          async getTeacherIdByUsername(username: string, tenant: string): Promise<number> {
                    const { User } = getTenantModels(tenant);
                    const user = await User.findOne({
                              where: { username },
                              attributes: ['user_id']
                    });

                    if (!user) {
                              throw new AppError('Teacher not found', 404);
                    }

                    return user.user_id;
          }

          async getTeacherClasses(username: string, tenant: string) {
                    const sequelize = getTenantSequelize(tenant);
                    const teacherId = await this.getTeacherIdByUsername(username, tenant);

                    // Multi-table join with distinct — keeping as raw SQL (complex join exception)
                    const results = await sequelize.query(
                              `SELECT DISTINCT
        tc.class_id,
        tc.subject_id,
        c.code AS class_code,
        c.name AS class_name
      FROM teacher_class_subjects tc
      JOIN classes c ON c.id = tc.class_id
      WHERE tc.teacher_id = :teacherId
      ORDER BY c.name`,
                              { replacements: { teacherId: String(teacherId) }, type: QueryTypes.SELECT }
                    );

                    return results;
          }

          async getAllClasses(tenant: string) {
                    const sequelize = getTenantSequelize(tenant);
                    const results = await sequelize.query(
                              `SELECT id, code, name FROM classes ORDER BY name`,
                              { type: QueryTypes.SELECT }
                    );
                    return results;
          }

          async getTeacherPrograms(username: string, tenant: string) {
                    const sequelize = getTenantSequelize(tenant);
                    const teacherId = await this.getTeacherIdByUsername(username, tenant);

                    const results = await sequelize.query(
                              `SELECT DISTINCT
        tc.program_id,
        pg.code AS program_code,
        pg.name AS program_name
      FROM teacher_class_subjects tc
      JOIN programs pg ON pg.id = tc.program_id
      WHERE tc.teacher_id = :teacherId
      ORDER BY pg.name`,
                              { replacements: { teacherId: String(teacherId) }, type: QueryTypes.SELECT }
                    );

                    return results;
          }

          async getTeacherAcademicYears(username: string, tenant: string) {
                    const sequelize = getTenantSequelize(tenant);
                    const teacherId = await this.getTeacherIdByUsername(username, tenant);

                    const results = await sequelize.query(
                              `SELECT DISTINCT
                                tc.academic_year_id,
                                ay.name AS academic_year_name
                              FROM teacher_class_subjects tc
                              JOIN academic_years ay ON ay.id = tc.academic_year_id
                              WHERE tc.teacher_id = :teacherId
                              ORDER BY ay.name`,
                              { replacements: { teacherId: String(teacherId) }, type: QueryTypes.SELECT }
                    );

                    return results;
          }
}
