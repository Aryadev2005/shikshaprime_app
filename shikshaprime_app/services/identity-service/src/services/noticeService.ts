import { Op } from 'sequelize';
import { getTenantModels } from '../models';

export class NoticeService {
  /**
   * Fetch all notices from the last 6 months, ordered oldest to newest
   */
  static async getRecentNotices(tenant: string): Promise<any[]> {
    const { Notice } = getTenantModels(tenant);
    // Calculate date 6 months ago
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    return await Notice.findAll({
      where: {
        from_date: {
          [Op.gte]: sixMonthsAgo,
        },
      },
      order: [['from_date', 'ASC']], // oldest to newest
    });
  }

  static async getAllNotices(page: number = 1, pageSize: number = 10, tenant: string): Promise<{ rows: any[]; count: number }> {
    const offset = (page - 1) * pageSize;
    const { Notice } = getTenantModels(tenant);
    const { rows, count } = await Notice.findAndCountAll({
      order: [['from_date', 'ASC']],
      limit: pageSize,
      offset,
    });
    return { rows, count };
  }

  static async createNotice(data: {
    title: string;
    description?: string;
    attachment?: string;
    from_date: Date;
    to_date: Date;
  }, tenant: string): Promise<any> {
    const { Notice } = getTenantModels(tenant);
    const notice = await Notice.create({
      title: data.title,
      description: data.description ?? null,
      attachment: data.attachment ?? null,
      from_date: data.from_date,
      to_date: data.to_date,
    });
    return notice;
  }

  static async deleteNotice(id: number, tenant: string): Promise<boolean> {
    const { Notice } = getTenantModels(tenant);
    const deletedCount = await Notice.destroy({
      where: { id },
    });
    return deletedCount > 0;
  }

  static async getNoticeById(id: number, tenant: string): Promise<any | null> {
    const { Notice } = getTenantModels(tenant);
    const notice = await Notice.findByPk(id);
    return notice;
  }
}
