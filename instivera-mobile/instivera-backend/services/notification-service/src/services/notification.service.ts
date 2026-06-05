import { Notification } from '../models/notification.model';
import { sendSuccess, sendError } from '../utils/response';

class NotificationService {
    async createNotification(data: any) {
        try {
            const notification = await Notification.create(data);
            return notification;
        } catch (error) {
            throw new Error('Error creating notification: ' + error.message);
        }
    }

    async getNotifications(userId: string) {
        try {
            const notifications = await Notification.findAll({ where: { userId } });
            return notifications;
        } catch (error) {
            throw new Error('Error fetching notifications: ' + error.message);
        }
    }

    async deleteNotification(notificationId: string) {
        try {
            const result = await Notification.destroy({ where: { id: notificationId } });
            return result > 0;
        } catch (error) {
            throw new Error('Error deleting notification: ' + error.message);
        }
    }
}

export default new NotificationService();