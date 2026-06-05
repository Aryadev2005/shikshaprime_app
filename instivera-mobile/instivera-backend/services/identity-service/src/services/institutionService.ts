import { AppError } from '../utils/appError';
import { globalSequelize } from '../db';
import { getGlobalModels } from '../models';

export class InstitutionService {
  /**
   * List all institutions, optionally filtered by type
   */
  async listInstitutions(type?: 'school' | 'college') {
    try {
      const { Institution } = getGlobalModels(globalSequelize);

      const where: any = { is_active: 1 };
      if (type) {
        where.type = type;
      }

      const institutions = await Institution.findAll({
        where,
        attributes: ['id', 'name', 'slug', 'type', 'logo_url'],
        raw: true,
      });

      return institutions.map((inst: any) => ({
        id: inst.id,
        name: inst.name,
        slug: inst.slug,
        type: inst.type,
        logo_url: inst.logo_url,
      }));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to list institutions');
    }
  }

  /**
   * Get single institution by slug
   */
  async getInstitutionBySlug(slug: string) {
    try {
      const { Institution } = getGlobalModels(globalSequelize);

      const institution = await Institution.findOne({
        where: { slug, is_active: 1 },
        attributes: ['id', 'name', 'slug', 'type', 'logo_url'],
        raw: true,
      });

      if (!institution) {
        throw AppError.notFound('Institution not found');
      }

      return institution;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to fetch institution');
    }
  }
}
