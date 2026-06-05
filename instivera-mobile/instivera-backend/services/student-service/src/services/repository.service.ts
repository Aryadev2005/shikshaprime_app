import path from 'path';
import { Op, fn, col } from 'sequelize';
import { getTenantModels } from '../models';

export class RepositoryService {
  async getCategories(
    tenant: string,
    filters: { class_id?: number; subject_id?: number },
  ) {
    const { RepositoryCategory, RepositoryFile } = getTenantModels(tenant);

    const where: any = { is_active: 1 };
    if (filters.class_id) {
      where[Op.or as any] = [{ class_id: filters.class_id }, { class_id: null }];
    }
    if (filters.subject_id) {
      where.subject_id = { [Op.in]: [filters.subject_id, null] };
    }

    const categories = await (RepositoryCategory as any).findAll({
      where,
      order: [['name', 'ASC']],
      raw: true,
    });

    // Count active files per category
    const ids: number[] = categories.map((c: any) => c.id);
    const counts: any[] = ids.length
      ? await (RepositoryFile as any).findAll({
          where: { category_id: { [Op.in]: ids }, is_active: 1 },
          attributes: ['category_id', [fn('COUNT', col('id')), 'count']],
          group: ['category_id'],
          raw: true,
        })
      : [];

    const countMap: Record<number, number> = {};
    for (const row of counts) countMap[row.category_id] = Number(row.count);

    return categories.map((c: any) => ({
      id: c.id,
      name: c.name,
      subject_id: c.subject_id ?? null,
      class_id: c.class_id ?? null,
      description: c.description ?? null,
      fileCount: countMap[c.id] ?? 0,
      created_at: c.created_at,
    }));
  }

  async getFilesByCategory(categoryId: number, tenant: string) {
    const { RepositoryFile } = getTenantModels(tenant);

    const files = await (RepositoryFile as any).findAll({
      where: { category_id: categoryId, is_active: 1 },
      order: [['title', 'ASC']],
      raw: true,
    });

    return files.map((f: any) => ({
      id: f.id,
      category_id: f.category_id,
      title: f.title,
      description: f.description ?? null,
      file_path: f.file_path,
      file_type: f.file_type ?? null,
      file_size_kb: f.file_size_kb ?? null,
      uploaded_by: f.uploaded_by ?? null,
      uploaded_by_type: f.uploaded_by_type ?? null,
      created_at: f.created_at,
    }));
  }

  async getFileById(fileId: number, tenant: string) {
    const { RepositoryFile } = getTenantModels(tenant);

    const file = await (RepositoryFile as any).findOne({
      where: { id: fileId, is_active: 1 },
      raw: true,
    });

    if (!file) {
      const err: any = new Error('File not found');
      err.status = 404;
      throw err;
    }

    return {
      id: file.id,
      category_id: file.category_id,
      title: file.title,
      description: file.description ?? null,
      file_path: file.file_path,
      file_type: file.file_type ?? null,
      file_size_kb: file.file_size_kb ?? null,
      uploaded_by: file.uploaded_by ?? null,
      created_at: file.created_at,
    };
  }

  resolveAbsolutePath(filePath: string): string {
    // file_path is stored as '/uploads/filename.pdf' — resolve to disk path
    const relative = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    return path.join(process.cwd(), relative);
  }
}

export default new RepositoryService();
