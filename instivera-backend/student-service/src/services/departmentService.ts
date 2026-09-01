// services/departmentService.ts
import { getTenantModels } from '../models';
import { AppError } from '../utils/appError';

export class DepartmentService {
  async getDepartmentById(id: number, tenant: string) {
    try {
      const { Department } = getTenantModels(tenant);
      const dept = await Department.findByPk(id);

      if (!dept) {
        throw new AppError('Department not found', 404);
      }

      return dept;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to fetch department: ${(error as Error).message}`, 500);
    }
  }

  async getAllDepartments(tenant: string) {
    try {
      const { Department } = getTenantModels(tenant);
      return await Department.findAll({
        order: [['name', 'ASC']]
      });
    } catch (error) {
      throw new AppError(`Failed to fetch departments: ${(error as Error).message}`, 500);
    }
  }

  async getDepartmentByName(name: string, tenant: string) {
    try {
      const { Department } = getTenantModels(tenant);
      const dept = await Department.findOne({
        where: { name: name.toLowerCase() }
      });

      return dept;
    } catch (error) {
      throw new AppError(`Failed to fetch department by name: ${(error as Error).message}`, 500);
    }
  }
}