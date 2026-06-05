import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';

export class NotificationController {
    private notificationService: NotificationService;

    constructor() {
        this.notificationService = new NotificationService();
    }

    public async createNotification(req: Request, res: Response): Promise<void> {
        try {
            const notificationData = req.body;
            const notification = await this.notificationService.createNotification(notificationData);
            res.status(201).json(notification);
        } catch (error) {
            res.status(500).json({ message: 'Error creating notification', error });
        }
    }

    public async getNotifications(req: Request, res: Response): Promise<void> {
        try {
            const notifications = await this.notificationService.getNotifications();
            res.status(200).json(notifications);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching notifications', error });
        }
    }

    public async deleteNotification(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            await this.notificationService.deleteNotification(id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error deleting notification', error });
        }
    }
}