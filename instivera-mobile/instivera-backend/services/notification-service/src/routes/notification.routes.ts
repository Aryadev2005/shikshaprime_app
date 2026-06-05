import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';

const router = Router();

// Define routes for notifications
router.post('/', NotificationController.createNotification);
router.get('/', NotificationController.getAllNotifications);
router.get('/:id', NotificationController.getNotificationById);
router.put('/:id', NotificationController.updateNotification);
router.delete('/:id', NotificationController.deleteNotification);

export default router;