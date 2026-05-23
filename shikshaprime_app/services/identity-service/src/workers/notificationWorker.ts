// Simple notification worker to process queued notifications
// This is a placeholder implementation - in production, you might use Redis queues or similar
import { QueryTypes } from "sequelize";
import { getAllTenants } from "../services/tenantRegistry";
import { getTenantSequelize } from "../server";
import { startPhonePeScheduler } from "./phonepeCronEngine";

interface NotificationRow {
    id: number;
    registration_id: number;
    channel: 'EMAIL' | 'SMS';
    to_address: string;
    template_key: string;
    payload: string;
    status: string;
}

let notificationInterval: NodeJS.Timeout | null = null;

export function startNotificationAndPhonePeWorker() {
    console.log('[NotificationWorker] Starting notification processing worker...');
    
    // Run immediately at startup
    void runForAllTenants();

    // Process queued notifications every 1 hour
    setInterval(runForAllTenants, 3600000);
}

export async function runForAllTenants() {
  try {
    const tenants = await getAllTenants();
    for (const tenant of tenants) {
      await processQueuedNotifications(tenant);
      await startPhonePeScheduler(tenant);
    }
  } catch (err) {
    console.error("[NotificationWorker] Failed to process notifications:", err);
  }
}

async function processQueuedNotifications(tenant: string) {
    try {
        const sequelize = getTenantSequelize(tenant);
        // Get queued notifications
        const queuedNotifications = await sequelize.query<NotificationRow>(
            `SELECT * FROM notifications WHERE status = 'QUEUED' ORDER BY created_at ASC LIMIT 10`,
            { type: QueryTypes.SELECT }
        );

        if (queuedNotifications.length === 0) {
            return; // No queued notifications
        }

        console.log(`[NotificationWorker] Processing ${queuedNotifications.length} queued notifications...`);

        for (const notification of queuedNotifications) {
            try {
                // Mark as processing to avoid duplicate processing
                await sequelize.query(
                    `UPDATE notifications SET status = 'SENT' WHERE id = :id`,
                    { replacements: { id: notification.id }, type: QueryTypes.UPDATE }
                );

                // Note: The actual sending logic is handled in the main application
                // This worker is just for cleanup and future queue processing
                console.log(`[NotificationWorker] Processed notification ${notification.id} (${notification.channel} to ${notification.to_address})`);

            } catch (error) {
                console.error(`[NotificationWorker] Failed to process notification ${notification.id}:`, error);
                
                // Mark as failed
                await sequelize.query(
                    `UPDATE notifications SET status = 'FAILED', error_message = :error WHERE id = :id`,
                    { 
                        replacements: { 
                            id: notification.id, 
                            error: error instanceof Error ? error.message : 'Unknown error' 
                        }, 
                        type: QueryTypes.UPDATE 
                    }
                );
            }
        }

    } catch (error) {
        console.error('[NotificationWorker] Error processing notification queue:', error);
    }
}

export function stopNotificationWorker() {
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
    console.log('[NotificationWorker] Notification worker stopped');
  }
}