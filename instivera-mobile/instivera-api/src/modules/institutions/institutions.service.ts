import { getGlobalModels } from '../../models';
import { AppError } from '../../utils/appError';

export class InstitutionService {
  static async listInstitutions(type?: string) {
    const { Institution } = getGlobalModels();
    const where: Record<string, any> = { is_active: 1 };
    if (type) where.type = type;
    return Institution.findAll({ where, attributes: ['id', 'name', 'slug', 'type', 'logo_url'] });
  }

  static async getBySlug(slug: string) {
    const { Institution } = getGlobalModels();
    const inst = await Institution.findOne({ where: { slug, is_active: 1 } });
    if (!inst) throw AppError.notFound('Institution not found');
    return inst;
  }
}
