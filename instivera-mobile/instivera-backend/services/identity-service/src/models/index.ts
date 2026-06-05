import { Sequelize } from 'sequelize';
import { defineUser, User } from './user';
import { defineTeacher, Teacher } from './teacher';
import { defineStudent, Student } from './student';
import { defineOtpRequest, OtpRequest } from './otp_request';
import { defineInstitution, Institution } from './institution';

/**
 * Returns all tenant-specific models (user, teacher, student, otp_request)
 * These models will use a tenant-specific Sequelize instance
 */
export function getTenantModels(sequelize: Sequelize) {
  return {
    User: defineUser(sequelize),
    Teacher: defineTeacher(sequelize),
    Student: defineStudent(sequelize),
    OtpRequest: defineOtpRequest(sequelize),
  };
}

/**
 * Returns global (non-tenant) models like institutions
 * These use the global Sequelize instance
 */
export function getGlobalModels(sequelize: Sequelize) {
  return {
    Institution: defineInstitution(sequelize),
  };
}

export type { User, Teacher, Student, OtpRequest, Institution };
