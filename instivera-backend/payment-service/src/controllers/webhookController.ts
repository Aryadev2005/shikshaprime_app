import { Response, NextFunction } from "express";
import { AppError } from "../utils/appError";
import { getTenantModels } from "../models";
import { sendPaymentConfirmationEmail, sendPaymentFailureEmail } from "../utils/emailService";
import { getTenantSequelize } from "../server";
import { notifyAdminsForPayment } from "../utils/notificationService";
import { QueryTypes } from "sequelize";

/**
 * Handle PhonePe webhook callback
 * POST /payment/webhooks/phonepe
 */
export const handlePhonePeWebhook = async (
  req,
  res: Response,
  next: NextFunction
) => {
  try {
    const webhookPayload = req.body;
    const { merchantOrderId, state, data } = webhookPayload;

    if (!merchantOrderId) {
      throw new AppError("Missing merchantOrderId in webhook payload", 400);
    }

    // Extract payment ID from merchantOrderId (SP-{paymentId}-{timestamp})
    const parts = merchantOrderId.split('-');
    if (parts[0] !== 'SP') {
      // Not a student payment, skip
      return res.status(200).json({
        status: 1,
        message: "Webhook acknowledged (not a student payment)",
      });
    }

    const paymentId = parseInt(parts[1]);
    const { StudentPayment, PaymentWebhook } = getTenantModels(req.tenant);

    // Find payment record
    const payment = await StudentPayment.findByPk(paymentId);
    if (!payment) {
      // Log webhook but don't fail
      console.warn(`[WEBHOOK] Payment record not found for paymentId: ${paymentId}`);
      return res.status(404).json({
        status: 0,
        message: "Payment record not found",
      });
    }

    // Log webhook for audit trail
    await PaymentWebhook.create({
      payment_id: paymentId,
      webhook_event: state,
      gateway_response: webhookPayload,
      status: 'received',
    });

    // Process based on payment state
    if (state === 'COMPLETED') {
      await processPaymentSuccess(payment, webhookPayload, req.tenant);
    } else if (state === 'FAILED') {
      await processPaymentFailure(payment, webhookPayload, req.tenant);
    } else if (state === 'PENDING') {
      await processPaymentPending(payment, webhookPayload);
    }

    // Update webhook status to processed
    await PaymentWebhook.update(
      { status: 'processed', processed_at: new Date() },
      { where: { payment_id: paymentId, webhook_event: state } }
    );

    return res.status(200).json({
      status: 1,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("[WEBHOOK] Error processing webhook:", error);
    next(error);
  }
};

/**
 * Process successful payment from webhook
 */
async function processPaymentSuccess(
  payment: any,
  webhookPayload: any,
  tenant: string
) {
  try {
    const { data } = webhookPayload;
    const transactionId = data?.transactionId || data?.merchantTransactionId;
    const amount = (data?.amount || 0) / 100; // PhonePe sends in paise
    const { PaymentTransaction } = getTenantModels(tenant);
    // Create transaction record
    const transaction = await PaymentTransaction.create({
      student_payment_id: payment.id,
      amount_paid: amount,
      payment_method: 'upi',
      transaction_ref: transactionId,
      gateway_order_id: data?.orderId,
      gateway_transaction_id: transactionId,
      gateway_status: 'COMPLETED',
      gateway_response: webhookPayload,
      receipt_number: `RCP-${Date.now()}`,
    });

    // Calculate new paid amount
    const newPaidAmount = Number(payment.paid_amount || 0) + amount;
    const totalAmount = Number(payment.amount);

    // Determine new status
    let newStatus: 'pending' | 'paid' | 'partial' | 'overdue' = 'partial';
    if (newPaidAmount >= totalAmount) {
      newStatus = 'paid';
    }

    // Update payment status
    await payment.update({
      paid_amount: newPaidAmount,
      paid_date: new Date(),
      status: newStatus,
      gateway_status: 'COMPLETED',
    });

    console.log(`[WEBHOOK] Payment ${payment.id} processed successfully. Status: ${newStatus}`);

    // Send success notification to student
    // Send email/SMS confirmation
    try {
      const sequelize = getTenantSequelize(tenant);
      const studentResult: any[] = await sequelize.query(
        `SELECT email, TRIM(CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name)) AS name FROM students WHERE id = :studentId LIMIT 1`,
        {
          replacements: { studentId: payment.student_id },
          type: QueryTypes.SELECT
        }
      );

      const { PaymentType } = getTenantModels(tenant);
      const paymentType = await PaymentType.findByPk(payment.payment_type_id);
      const feeTypeName = paymentType ? paymentType.name : "Academic Fee";

      let studentName = 'Student';

      if (studentResult && studentResult.length > 0) {
        const student = studentResult[0];
        studentName = student.name;
        
        if (student.email) {
          try {
            console.log(`[WEBHOOK] Attempting to send success email to ${student.email}...`);
            await sendPaymentConfirmationEmail(
              student.email,
              student.name,
              amount,
              feeTypeName,
              transactionId
            );
            console.log(`[WEBHOOK] Success email fired for ${student.email}`);
          } catch (emailErr) {
            console.error("[WEBHOOK ERROR] Failed to send confirmation email:", emailErr);
          }
        } else {
          console.warn(`[WEBHOOK] Student email not found for student_id: ${payment.student_id}`);
        }
      }
      
      // Notify Admins regardless of email success
      await notifyAdminsForPayment(sequelize, studentName, amount, feeTypeName);
    } catch (dbErr) {
      console.error("[WEBHOOK ERROR] Failed to fetch student details or notify admins:", dbErr);
    }
  } catch (error) {
    console.error("[WEBHOOK] Error processing payment success:", error);
    throw error;
  }
}

/**
 * Process failed payment from webhook
 */
async function processPaymentFailure(
  payment: any,
  webhookPayload: any,
  tenant: string
) {
  try {
    await payment.update({
      gateway_status: 'FAILED',
      gateway_response: webhookPayload,
    });

    console.log(`[WEBHOOK] Payment ${payment.id} failed. Student can retry.`);

    // Fetch student info for email notification
    if (tenant && payment.student_id) {
      const sequelize = getTenantSequelize(tenant);
      const studentResult: any[] = await sequelize.query(
        `SELECT email, TRIM(CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name)) AS name FROM students WHERE id = :studentId LIMIT 1`,
        {
          replacements: { studentId: payment.student_id },
          type: QueryTypes.SELECT
        }
      );
      
      const paymentTypeResult: any[] = await sequelize.query(
        `SELECT name FROM payment_types WHERE id = :typeId LIMIT 1`,
        {
          replacements: { typeId: payment.payment_type_id },
          type: QueryTypes.SELECT
        }
      );

      if (studentResult && studentResult.length > 0 && studentResult[0].email) {
        const student = studentResult[0];
        const paymentTypeName = paymentTypeResult?.[0]?.name || "Fee Payment";
        const transactionId = webhookPayload?.data?.transactionId || webhookPayload?.data?.merchantTransactionId || "N/A";
        
        console.log(`[WEBHOOK] Attempting to send failure email to ${student.email}...`);
        await sendPaymentFailureEmail(
          student.email,
          student.name,
          payment.amount,
          paymentTypeName,
          transactionId
        );
        console.log(`[WEBHOOK] Failure email fired for ${student.email}`);
      }
    }
  } catch (error) {
    console.error("[WEBHOOK] Error processing payment failure:", error);
    throw error;
  }
}

/**
 * Process pending payment from webhook
 */
async function processPaymentPending(
  payment: any,
  webhookPayload: any
) {
  try {
    await payment.update({
      gateway_response: webhookPayload,
    });

    console.log(`[WEBHOOK] Payment ${payment.id} is pending.`);

    // TODO: Schedule status check after delay
  } catch (error) {
    console.error("[WEBHOOK] Error processing payment pending:", error);
    throw error;
  }
}