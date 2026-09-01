import { QueryTypes } from "sequelize";
import { getTenantModels } from "../models";
import { getTenantSequelize } from "../server";
import { AppError } from "../utils/appError";

export class UtilService {
    async getFacultyIdFromUser(user: any, tenant: string) {
          if (!user) {
                    throw new AppError('Authentication required', 401);
          }         

          // Try to find faculty by email
          const { Teacher } = getTenantModels(tenant);
          let faculty = await Teacher.findOne({
                    where: {
                              email: user.email || '',
                              is_active: true,
                    }
          });

          if (!faculty) {
                    throw new AppError('No faculty profiles exist in the system', 404);
          }

          console.log('[getFacultyIdFromUser] Using faculty:', { id: faculty.id, name: faculty.first_name });
          return faculty.id;
    }
    async getStudentIdFromUser(user: any, tenant: string) {
          if (!user) {
                    throw new AppError('Authentication required', 401);
          }         

          // Try to find faculty by email
          const { Student } = getTenantModels(tenant);
          let student = await Student.findOne({
                    where: {
                              email: user.email || ''
                    }
          });

          if (!student) {
                    throw new AppError('No student profiles exist in the system', 404);
          }          
          return student.id;
    }
    async getUserId(user: any, tenant: string) {
          if (!user) {
                    throw new AppError('Authentication required', 401);
          }         

          // Try to find user by email
          const userId: any = await getTenantSequelize(tenant).query(
                `SELECT user_id
                FROM users 
                WHERE email = :email LIMIT 1`,
                {
                replacements: { email: user.email },
                type: QueryTypes.SELECT
                }
            );
            console.log(user);

          if (!userId) {
                    throw new AppError('No user profiles exist in the system', 404);
          }          
          return userId[0].user_id;
    }
}