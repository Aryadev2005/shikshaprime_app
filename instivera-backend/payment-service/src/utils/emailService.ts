import nodemailer from "nodemailer";
import { config } from "../config";

console.log("[EMAIL SERVICE] Initializing transporter with config:", {
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  user: config.smtp.username,
  fromEmail: config.smtp.fromEmail,
  fromName: config.smtp.fromName
});

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.username,
    pass: config.smtp.password
  },
  tls: {
    rejectUnauthorized: false
  }
});

export const sendPaymentConfirmationEmail = async (
  to: string,
  studentName: string,
  amount: number,
  feeType: string,
  transactionId: string
) => {
  try {
    const fromName = config.smtp.fromName;
    const fromEmail = config.smtp.fromEmail;

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: "Payment Confirmed - Instivera",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #16a34a; margin-bottom: 20px;">Payment Confirmed</h2>
          <p>Hello <b>${studentName}</b>,</p>
          <p>Your payment has been received successfully. Below are the transaction details:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 0; color: #64748b;">Fee Category</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #1e293b;">${feeType}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 0; color: #64748b;">Amount Paid</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #16a34a;">₹${amount}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 0; color: #64748b;">Transaction/Ref ID</td>
              <td style="padding: 10px 0; text-align: right; font-family: monospace; color: #1e293b;">${transactionId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 0; color: #64748b;">Date</td>
              <td style="padding: 10px 0; text-align: right; color: #1e293b;">${new Date().toLocaleDateString('en-IN')}</td>
            </tr>
          </table>
          <p style="margin-top: 30px; font-size: 14px; color: #64748b;">If you have any questions, please contact our support team.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">This is an automated email. Please do not reply.</p>
        </div>
      `
    });

    console.log(`[EMAIL] Payment confirmation sent successfully to ${to}`);
  } catch (error) {
    console.error("[EMAIL ERROR] Failed to send payment confirmation email:", error);
    // Don't throw to prevent breaking request lifecycle, but log it
  }
};

export const sendPaymentAssignmentEmail = async (
  to: string,
  studentName: string,
  amount: number,
  feeType: string,
  dueDate: Date | string,
  paymentLink: string
) => {
  try {
    const fromName = config.smtp.fromName;
    const fromEmail = config.smtp.fromEmail;
    const formattedDate = new Date(dueDate).toLocaleDateString('en-IN');

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: "New Fee Assigned - Instivera",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #ea580c; margin-bottom: 20px;">New Fee Assigned</h2>
          <p>Hello <b>${studentName}</b>,</p>
          <p>A new fee has been assigned to your account. Below are the details:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 0; color: #64748b;">Fee Category</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #1e293b;">${feeType}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 0; color: #64748b;">Amount Due</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #ea580c;">₹${amount}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 0; color: #64748b;">Due Date</td>
              <td style="padding: 10px 0; text-align: right; color: #1e293b;">${formattedDate}</td>
            </tr>
          </table>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Pay Now</a>
          </div>

          <p style="margin-top: 30px; font-size: 14px; color: #64748b;">Please log in to your dashboard to complete the payment before the due date.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">This is an automated email. Please do not reply.</p>
        </div>
      `
    });

    console.log(`[EMAIL] Payment assignment notification sent successfully to ${to}`);
  } catch (error) {
    console.error("[EMAIL ERROR] Failed to send payment assignment email to", to, error);
  }
};

export const sendPaymentFailureEmail = async (
  to: string,
  studentName: string,
  amount: number,
  feeType: string,
  transactionId: string
) => {
  try {
    const fromName = config.smtp.fromName;
    const fromEmail = config.smtp.fromEmail;

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: "Payment Failed - Instivera",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #e11d48; margin-bottom: 20px;">Payment Failed</h2>
          <p>Hello <b>${studentName}</b>,</p>
          <p>Unfortunately, your recent payment attempt has failed. No money should be deducted from your account. If any amount was debited, it will be refunded by your bank within 3-5 business days.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 0; color: #64748b;">Fee Category</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #1e293b;">${feeType}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 0; color: #64748b;">Amount Attempted</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #e11d48;">₹${amount}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 0; color: #64748b;">Transaction/Ref ID</td>
              <td style="padding: 10px 0; text-align: right; font-family: monospace; color: #1e293b;">${transactionId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 0; color: #64748b;">Date</td>
              <td style="padding: 10px 0; text-align: right; color: #1e293b;">${new Date().toLocaleDateString('en-IN')}</td>
            </tr>
          </table>
          <p style="margin-top: 30px; font-size: 14px; color: #64748b;">Please log in to your dashboard and try the payment again using a different payment method.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">This is an automated email. Please do not reply.</p>
        </div>
      `
    });

    console.log(`[EMAIL] Payment failure notification sent successfully to ${to}`);
  } catch (error) {
    console.error("[EMAIL ERROR] Failed to send payment failure email:", error);
  }
};
