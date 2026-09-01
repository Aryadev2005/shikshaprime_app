import { Request, Response, NextFunction } from "express";
import { Op, QueryTypes } from "sequelize";
import { getTenantSequelize } from "../server";
import { getTenantModels } from "../models";

const sendSuccess = (res: Response, message: string, data: any = null, status = 200) => {
    return res.status(status).json({
        success: true,
        message,
        data,
    });
};

async function getDbUserId(sequelize: any, user: any): Promise<number | null> {
    if (user?.user_id) return Number(user.user_id);
    if (user?.id && !isNaN(Number(user.id))) return Number(user.id);
    const [dbUser]: any = await sequelize.query(
        `SELECT user_id FROM users WHERE username = :username OR email = :email LIMIT 1`,
        {
            replacements: {
                username: user?.username || "",
                email: user?.email || "",
            },
            type: QueryTypes.SELECT,
        }
    );
    return dbUser ? dbUser.user_id : null;
}

export const getUserNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenant = (req as any).tenant;
        const user = (req as any).user;
        const sequelize = getTenantSequelize(tenant);
        const { GeneralNotification } = getTenantModels(tenant);

        const dbUserId = await getDbUserId(sequelize, user);
        const userId = dbUserId || 0;

        const notifications = await GeneralNotification.findAll({
            where: {
                [Op.or]: [{ user_id: userId }, { user_id: null }],
                channel: { [Op.or]: ["IN_APP", null] },
            },
            order: [["created_at", "DESC"]],
            limit: 50,
        });

        const seenMessages = new Set<string>();
        const formatted: any[] = [];

        for (const n of notifications) {
            const msgKey = (n.message || "").trim();
            if (!msgKey || !seenMessages.has(msgKey)) {
                if (msgKey) seenMessages.add(msgKey);
                formatted.push({
                    id: String(n.id),
                    title: n.title || "Notification",
                    message: n.message || "",
                    type: n.type || "info",
                    link: n.link || null,
                    read: Boolean(n.is_read),
                    timestamp: n.created_at,
                });
            }
        }

        const unreadCount = formatted.filter((n: any) => !n.read).length;

        return sendSuccess(res, "Notifications fetched successfully", {
            notifications: formatted,
            unreadCount,
        });
    } catch (error) {
        next(error);
    }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenant = (req as any).tenant;
        const user = (req as any).user;
        const sequelize = getTenantSequelize(tenant);
        const { GeneralNotification } = getTenantModels(tenant);

        const dbUserId = await getDbUserId(sequelize, user);
        const userId = dbUserId || 0;
        const notificationId = req.params.id;

        if (notificationId) {
            await GeneralNotification.update(
                { is_read: true },
                {
                    where: {
                        id: notificationId,
                        [Op.or]: [{ user_id: userId }, { user_id: null }],
                    },
                }
            );
        }

        return sendSuccess(res, "Notification marked as read");
    } catch (error) {
        next(error);
    }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenant = (req as any).tenant;
        const user = (req as any).user;
        const sequelize = getTenantSequelize(tenant);
        const { GeneralNotification } = getTenantModels(tenant);

        const dbUserId = await getDbUserId(sequelize, user);
        const userId = dbUserId || 0;

        await GeneralNotification.update(
            { is_read: true },
            {
                where: {
                    [Op.or]: [{ user_id: userId }, { user_id: null }],
                    channel: { [Op.or]: ["IN_APP", null] },
                },
            }
        );

        return sendSuccess(res, "All notifications marked as read");
    } catch (error) {
        next(error);
    }
};

export const deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenant = (req as any).tenant;
        const user = (req as any).user;
        const sequelize = getTenantSequelize(tenant);
        const { GeneralNotification } = getTenantModels(tenant);

        const userId = await getDbUserId(sequelize, user);
        const notificationId = req.params.id;

        if (userId && notificationId) {
            await GeneralNotification.destroy({
                where: {
                    id: notificationId,
                    user_id: userId,
                },
            });
        }

        return sendSuccess(res, "Notification deleted");
    } catch (error) {
        next(error);
    }
};

export const clearAllNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenant = (req as any).tenant;
        const user = (req as any).user;
        const sequelize = getTenantSequelize(tenant);
        const { GeneralNotification } = getTenantModels(tenant);

        const userId = await getDbUserId(sequelize, user);

        if (userId) {
            await GeneralNotification.destroy({
                where: {
                    user_id: userId,
                    channel: { [Op.or]: ["IN_APP", null] },
                },
            });
        }

        return sendSuccess(res, "All notifications cleared");
    } catch (error) {
        next(error);
    }
};

