import nodemailer from 'nodemailer';
import config from '../config';
import { logger } from './logger';

// Create ZeptoMail transporter
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

/**
 * Send OTP email
 * @param email Recipient email
 * @param otp 6-digit OTP
 * @param name Recipient name
 */
export async function sendOtpEmail(
  email: string,
  otp: string,
  name: string = 'User'
): Promise<boolean> {
  try {
    if (!config.email.pass) {
      logger.warn(`📧 DEV MODE: OTP for ${email} = ${otp}`);
      return false;
    }

    await transporter.sendMail({
      from: config.email.from,
      to: email,
      subject: 'Your OTP for Instivera Login',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Hello ${name},</p>
          <p>Your One-Time Password (OTP) for Instivera login is:</p>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <h1 style="margin: 0; letter-spacing: 5px; color: #333;">${otp}</h1>
          </div>
          <p><strong>Valid for 10 minutes only.</strong></p>
          <p>If you did not request this OTP, please ignore this email.</p>
          <br/>
          <p>Best regards,<br/>Instivera Team</p>
        </div>
      `,
    });

    logger.info(`📧 OTP sent to ${email}`);
    return true;
  } catch (error) {
    logger.error(`📧 Error sending OTP email to ${email}:`, error);
    return false;
  }
}
