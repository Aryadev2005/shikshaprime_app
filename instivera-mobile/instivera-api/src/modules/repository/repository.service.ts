import path from 'path';
import fs from 'fs';
import { getTenantModels } from '../../models';
import { AppError } from '../../utils/appError';
import { getTenantSequelize } from '../../db';
import { QueryTypes } from 'sequelize';

export class RepositoryService {
  static async getCategories(tenant: string, filters: { class_id?: string; subject_id?: string }) {
    const { RepositoryCategory, RepositoryFile } = getTenantModels(tenant) as any;
    const where: Record<string, any> = { is_active: 1 };
    if (filters.class_id) where.class_id = filters.class_id;
    if (filters.subject_id) where.subject_id = filters.subject_id;

    const categories = await RepositoryCategory.findAll({
      where,
      include: [{ model: RepositoryFile, as: 'files', attributes: ['id'], where: { is_active: 1 }, required: false }],
    });

    return categories.map((c: any) => ({
      ...c.toJSON(),
      file_count: c.files?.length ?? 0,
      files: undefined,
    }));
  }

  static async getFilesByCategory(categoryId: number, tenant: string) {
    const { RepositoryFile } = getTenantModels(tenant);
    return RepositoryFile.findAll({
      where: { category_id: categoryId, is_active: 1 },
      order: [['created_at', 'DESC']],
      attributes: ['id', 'title', 'description', 'file_type', 'file_size_kb', 'created_at'],
    });
  }

  static async getFileById(fileId: number, tenant: string) {
    const { RepositoryFile } = getTenantModels(tenant);
    const file = await RepositoryFile.findOne({ where: { id: fileId, is_active: 1 } });
    if (!file) throw AppError.notFound('File not found');
    return file;
  }

  static resolveAbsolutePath(filePath: string): string {
    if (path.isAbsolute(filePath)) return filePath;
    return path.join(process.cwd(), filePath);
  }
}
