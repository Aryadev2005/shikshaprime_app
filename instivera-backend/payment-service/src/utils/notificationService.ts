import { QueryTypes } from "sequelize";

export const notifyAdminsForPayment = async (sequelize: any, studentName: string, amount: string | number, feeTypeName: string) => {
  try {
    const adminQuery = `SELECT user_id FROM users WHERE LOWER(role) = 'admin'`;
    const admins: any[] = await sequelize.query(adminQuery, { type: QueryTypes.SELECT });

    if (admins && admins.length > 0) {
      const message = `Student ${studentName} has successfully paid ₹${amount} for ${feeTypeName}.`;
      const insertNotificationQuery = `
        INSERT INTO notifications (
          user_id, title, message, type, channel, link, is_read, created_at, updated_at
        ) VALUES ${admins.map(() => '(?, ?, ?, ?, ?, ?, 0, NOW(), NOW())').join(', ')}
      `;

      const notifReplacements = admins.flatMap((admin: any) => [
        admin.user_id,
        "Payment Received",
        message,
        'info',
        'IN_APP',
        '/admin/payment/dashboard'
      ]);

      await sequelize.query(insertNotificationQuery, {
        replacements: notifReplacements,
        type: QueryTypes.INSERT,
      });
    }
  } catch (error) {
    console.error("[PAYMENT NOTIFICATION] Failed to notify admins:", error);
  }
};
