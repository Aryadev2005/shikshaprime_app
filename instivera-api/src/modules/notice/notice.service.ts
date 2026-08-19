import { Op } from 'sequelize';
import { getTenantModels } from '../../models';
import { AppError } from '../../utils/appError';

export class NoticeService {
  static async getNotices(tenant: string, filters: { audience?: string; page?: number; limit?: number }) {
    const { Notice } = getTenantModels(tenant);
    const { audience, page = 1, limit = 20 } = filters;
    const validAudiences = ['ALL', 'STUDENT', 'TEACHER'];

    const where: Record<string, any> = { is_active: 1 };
    if (audience) {
      const upper = String(audience).toUpperCase();
      if (!validAudiences.includes(upper)) throw AppError.badRequest('Invalid audience value');
      where[Op.or as any] = [{ target_audience: upper }, { target_audience: 'ALL' }];
    }

    const offset = (Number(page) - 1) * Number(limit);
    const { count, rows } = await Notice.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset,
    });

    return {
      notices: rows.map((n) => this.formatNotice(n)),
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / Number(limit)),
    };
  }

  static async getNoticeById(noticeId: string | number, tenant: string) {
    const { Notice } = getTenantModels(tenant);
    let notice = null;

    // Try UUID first, then numeric id
    if (typeof noticeId === 'string' && noticeId.includes('-')) {
      notice = await Notice.findOne({ where: { notice_id: noticeId, is_active: 1 } });
    } else {
      notice = await Notice.findOne({ where: { id: noticeId, is_active: 1 } });
    }

    if (!notice) throw AppError.notFound('Notice not found');
    return this.formatNotice(notice);
  }

  private static formatNotice(n: any) {
    const raw = n.toJSON ? n.toJSON() : n;
    return {
      ...raw,
      // Normalise dual-schema columns
      body: raw.content || raw.description,
      date: raw.published_date || raw.from_date,
      expires: raw.expires_at || raw.to_date,
    };
  }
}
