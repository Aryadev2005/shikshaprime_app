import { Op, QueryTypes } from 'sequelize';
import { getTenantModels } from '../models';

export class NoticeService {
  private static async notifyAllUsersForNotice(title: string, message: string, noticeId: number, tenant: string) {
    try {
      const { getTenantSequelize } = require('../server');
      const sequelize = getTenantSequelize(tenant);

      // Notify students
      await sequelize.query(`
        INSERT INTO notifications (user_id, title, message, type, channel, link, is_read, created_at, updated_at)
        SELECT DISTINCT COALESCE(s.user_id, u.user_id), :title, :message, 'info', 'IN_APP', :link, 0, NOW(), NOW()
        FROM students s
        LEFT JOIN users u ON u.email COLLATE utf8mb4_general_ci = s.email COLLATE utf8mb4_general_ci
        WHERE COALESCE(s.user_id, u.user_id) IS NOT NULL;
      `, {
        replacements: { title, message, link: `/admin/notices/${noticeId}?action=view` },
        type: QueryTypes.INSERT
      });

      // Notify teachers
      await sequelize.query(`
        INSERT INTO notifications (user_id, title, message, type, channel, link, is_read, created_at, updated_at)
        SELECT DISTINCT COALESCE(t.user_id, u.user_id), :title, :message, 'info', 'IN_APP', :link, 0, NOW(), NOW()
        FROM teachers t
        LEFT JOIN users u ON u.email COLLATE utf8mb4_general_ci = t.email COLLATE utf8mb4_general_ci
        WHERE COALESCE(t.user_id, u.user_id) IS NOT NULL;
      `, {
        replacements: { title, message, link: `/admin/notices/${noticeId}?action=view` },
        type: QueryTypes.INSERT
      });
    } catch (err) {
      console.error("[NOTICE] Failed to insert notifications:", err);
    }
  }

  /**
   * Fetch active notices (where from_date <= today and to_date >= today)
   */
  static async getRecentNotices(tenant: string): Promise<any[]> {
    const { Notice } = getTenantModels(tenant);
    const { getTenantSequelize } = require('../server');
    const sequelize = getTenantSequelize(tenant);

    return await Notice.findAll({
      where: sequelize.literal(`DATE(to_date) >= CURDATE() AND DATE(from_date) <= CURDATE()`),
      order: [['from_date', 'DESC'], ['id', 'DESC']],
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
    
    // Notify all students and teachers
    await this.notifyAllUsersForNotice("New Notice Published", data.title, notice.id, tenant);

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
