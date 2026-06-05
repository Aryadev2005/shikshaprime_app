import { Op, WhereOptions } from 'sequelize';
import { getTenantModels } from '../models';

export class NoticeService {
  async getNotices(
    tenant: string,
    filters: {
      audience?: 'STUDENT' | 'TEACHER' | 'ALL';
      page?: number;
      limit?: number;
    }
  ) {
    const { Notice } = getTenantModels(tenant);
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const where: WhereOptions = { is_active: 1 };

    // Audience filter: show notices targeted at requested audience OR 'ALL'
    if (filters.audience && filters.audience !== 'ALL') {
      (where as any).target_audience = { [Op.in]: [filters.audience, 'ALL'] };
    }

    const { rows, count } = await (Notice as any).findAndCountAll({
      where,
      order: [
        ['published_date', 'DESC'],
        ['from_date', 'DESC'],
        ['created_at', 'DESC'],
      ],
      limit,
      offset,
    });

    return {
      notices: rows.map((n: any) => this.formatNotice(n)),
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getNoticeById(noticeId: string | number, tenant: string) {
    const { Notice } = getTenantModels(tenant);

    // Try notice_id (UUID string) first, fall back to numeric id
    let notice: any = null;
    if (isNaN(Number(noticeId))) {
      notice = await (Notice as any).findOne({ where: { notice_id: noticeId } });
    } else {
      notice = await (Notice as any).findByPk(Number(noticeId));
    }

    if (!notice) {
      const err: any = new Error('Notice not found');
      err.status = 404;
      throw err;
    }

    return this.formatNotice(notice);
  }

  private formatNotice(n: any) {
    return {
      id: n.id,
      notice_id: n.notice_id || String(n.id),
      title: n.title,
      // Use content if available, fall back to description
      content: n.content || n.description || null,
      published_date: n.published_date || n.from_date || n.created_at,
      expires_at: n.expires_at || n.to_date || null,
      target_audience: n.target_audience || 'ALL',
      is_active: n.is_active ?? 1,
      created_by: n.created_by || null,
      attachment: n.attachment || null,
      institution_type: n.institution_type || null,
      created_at: n.created_at,
    };
  }
}

export default new NoticeService();
