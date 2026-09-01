import { Router } from "express";
import {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
} from "../controllers/notificationController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.get("/", requireAuth, getUserNotifications);
router.put("/read-all", requireAuth, markAllAsRead);
router.put("/:id/read", requireAuth, markAsRead);
router.delete("/clear-all", requireAuth, clearAllNotifications);
router.delete("/:id", requireAuth, deleteNotification);

export default router;
