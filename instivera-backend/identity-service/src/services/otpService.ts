import { QueryTypes } from 'sequelize';
import { AppError } from '../utils/appError';
import { getTenantSequelize } from '../server';

interface OTPRecord {
          id: number;
          phone_number: string;
          otp_code: string;
          expires_at: string;
          attempts: number;
          delivery_status: 'pending' | 'sent' | 'failed';
          created_at: string;
}

interface EmailOTPRecord {
          id: number;
          email: string;
          otp_code: string;
          expires_at: string;
          attempts: number;
          delivery_status: 'pending' | 'sent' | 'failed';
          created_at: string;
}


// Generate 6-digit OTP
const generateOTP = (): string => {
          return Math.floor(100000 + Math.random() * 900000).toString();
};

export class OtpService {
          async sendOtp(phoneNumber: string, tenant:string) {
            const sequelize = getTenantSequelize(tenant);

                    // Check for recent OTP within 60s — but allow immediate retry if last delivery failed
                    const recentOTP = await sequelize.query<OTPRecord>(
                              `SELECT * FROM otp_requests 
       WHERE phone_number = :phoneNumber 
       AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)
       ORDER BY created_at DESC LIMIT 1`,
                              { replacements: { phoneNumber }, type: QueryTypes.SELECT }
                    );

                    if (recentOTP.length > 0) {
                              const lastOtp = recentOTP[0];
                              // Allow bypass only when last OTP was never delivered
                              if (lastOtp.delivery_status !== 'failed') {
                                        throw new AppError('Please wait 60 seconds before requesting another OTP', 429);
                              }
                              console.log(`🔄 Bypassing rate-limit for ${phoneNumber}: last OTP delivery_status=failed`);
                    }

                    const otp = generateOTP();
                    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

                    // Delete existing OTP(s) for this number
                    await sequelize.query(
                              `DELETE FROM otp_requests WHERE phone_number = :phoneNumber`,
                              { replacements: { phoneNumber }, type: QueryTypes.DELETE }
                    );

                    // Insert new OTP — delivery_status starts as 'pending'
                    await sequelize.query(
                              `INSERT INTO otp_requests (phone_number, otp_code, expires_at, attempts, delivery_status, created_at, updated_at)
       VALUES (:phoneNumber, :otp, :expiresAt, 0, 'pending', NOW(), NOW())`,
                              { replacements: { phoneNumber, otp, expiresAt }, type: QueryTypes.INSERT }
                    );

                    return { otp, expiresAt };
          }

          /**
           * Call after the SMS/email send attempt to record whether delivery succeeded.
           */
          async updateSmsDeliveryStatus(phoneNumber: string, status: 'sent' | 'failed', tenant: string) {
                    const sequelize = getTenantSequelize(tenant);
                    await sequelize.query(
                              `UPDATE otp_requests SET delivery_status = :status, updated_at = NOW()
       WHERE phone_number = :phoneNumber
       ORDER BY created_at DESC LIMIT 1`,
                              { replacements: { status, phoneNumber }, type: QueryTypes.UPDATE }
                    );
          }

          async verifyOtp(phoneNumber: string, otp: string, tenant: string) {
                    const sequelize = getTenantSequelize(tenant);
                    const [otpRecord] = await sequelize.query<OTPRecord>(
                              `SELECT * FROM otp_requests WHERE phone_number = :phoneNumber ORDER BY created_at DESC LIMIT 1`,
                              { replacements: { phoneNumber }, type: QueryTypes.SELECT }
                    );

                    if (!otpRecord) {
                              throw new AppError('No OTP found for this phone number. Please request a new one.', 400);
                    }

                    const now = new Date();
                    const expiresAt = new Date(otpRecord.expires_at);
                    if (now > expiresAt) {
                              await sequelize.query(
                                        `DELETE FROM otp_requests WHERE phone_number = :phoneNumber`,
                                        { replacements: { phoneNumber }, type: QueryTypes.DELETE }
                              );
                              throw new AppError('OTP has expired. Please request a new one.', 400);
                    }

                    if (otpRecord.attempts >= 5) {
                              throw new AppError('Too many failed attempts. Please request a new OTP.', 400);
                    }

                    if (otpRecord.otp_code !== otp) {
                              await sequelize.query(
                                        `UPDATE otp_requests SET attempts = attempts + 1, updated_at = NOW() WHERE phone_number = :phoneNumber`,
                                        { replacements: { phoneNumber }, type: QueryTypes.UPDATE }
                              );
                              return { success: false, attemptsLeft: 4 - otpRecord.attempts };
                    }

                    // OTP matched — clean up and mark verified
                    await sequelize.query(
                              `DELETE FROM otp_requests WHERE phone_number = :phoneNumber`,
                              { replacements: { phoneNumber }, type: QueryTypes.DELETE }
                    );

                    await sequelize.query(
                              `INSERT INTO verified_phone_numbers (phone_number, verified_at, created_at, updated_at)
       VALUES (:phoneNumber, NOW(), NOW(), NOW())
       ON DUPLICATE KEY UPDATE verified_at = NOW(), updated_at = NOW()`,
                              { replacements: { phoneNumber }, type: QueryTypes.INSERT }
                    );

                    return { success: true };
          }

          async checkValidation(phoneNumber: string, tenant: string) {
                    const sequelize = getTenantSequelize(tenant);
                    const [verification] = await sequelize.query(
                              'SELECT * FROM verified_phone_numbers WHERE phone_number = ?',
                              { replacements: [phoneNumber], type: QueryTypes.SELECT }
                    ) as any[];

                    return {
                              isValidated: !!verification,
                              phoneNumber,
                              validatedAt: verification ? verification.verified_at : null
                    };
          }

          async sendEmailOtp(email: string, tenant: string) {
                    // Rate limit — 60s cooldown, but bypass if last delivery failed
                    const sequelize = getTenantSequelize(tenant);
                    const recentOTP = await sequelize.query<EmailOTPRecord>(
                              `SELECT * FROM email_otp_requests 
                               WHERE email = :email 
                               AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)
                               ORDER BY created_at DESC LIMIT 1`,
                              { replacements: { email }, type: QueryTypes.SELECT }
                    );

                    if (recentOTP.length > 0) {
                              const lastOtp = recentOTP[0];
                              // Allow bypass only when last OTP was never delivered
                              if (lastOtp.delivery_status !== 'failed') {
                                        throw new AppError('Please wait 60 seconds before requesting another OTP', 429);
                              }
                              console.log(`🔄 Bypassing email rate-limit for ${email}: last OTP delivery_status=failed`);
                    }

                    const otp = generateOTP();
                    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

                    // Delete old OTPs for this email
                    await sequelize.query(
                              `DELETE FROM email_otp_requests WHERE email = :email`,
                              { replacements: { email }, type: QueryTypes.DELETE }
                    );

                    // Insert new OTP — delivery_status starts as 'pending'
                    await sequelize.query(
                              `INSERT INTO email_otp_requests (email, otp_code, expires_at, attempts, delivery_status, created_at, updated_at)
                               VALUES (:email, :otp, :expiresAt, 0, 'pending', NOW(), NOW())`,
                              { replacements: { email, otp, expiresAt }, type: QueryTypes.INSERT }
                    );

                    return { otp, expiresAt };
          }

          /**
           * Call after the email send attempt to record whether delivery succeeded.
           */
          async updateEmailDeliveryStatus(email: string, status: 'sent' | 'failed', tenant: string) {
                    const sequelize = getTenantSequelize(tenant);
                    await sequelize.query(
                              `UPDATE email_otp_requests SET delivery_status = :status, updated_at = NOW()
                               WHERE email = :email
                               ORDER BY created_at DESC LIMIT 1`,
                              { replacements: { status, email }, type: QueryTypes.UPDATE }
                    );
          }

          async verifyEmailOtp(email: string, otp: string, tenant: string) {
                    const sequelize = getTenantSequelize(tenant);
                    const [otpRecord] = await sequelize.query<EmailOTPRecord>(
                              `SELECT * FROM email_otp_requests WHERE email = :email ORDER BY created_at DESC LIMIT 1`,
                              { replacements: { email }, type: QueryTypes.SELECT }
                    );

                    if (!otpRecord) {
                              throw new AppError('No OTP found for this email. Please request a new one.', 400);
                    }

                    const now = new Date();
                    const expiresAt = new Date(otpRecord.expires_at);
                    if (now > expiresAt) {
                              await sequelize.query(
                                        `DELETE FROM email_otp_requests WHERE email = :email`,
                                        { replacements: { email }, type: QueryTypes.DELETE }
                              );
                              throw new AppError('OTP has expired. Please request a new one.', 400);
                    }

                    if (otpRecord.attempts >= 5) {
                              throw new AppError('Too many failed attempts. Please request a new OTP.', 400);
                    }

                    if (otpRecord.otp_code !== otp) {
                              await sequelize.query(
                                        `UPDATE email_otp_requests SET attempts = attempts + 1, updated_at = NOW() WHERE email = :email`,
                                        { replacements: { email }, type: QueryTypes.UPDATE }
                              );
                              return { success: false, attemptsLeft: 4 - otpRecord.attempts };
                    }

                    // OTP matched — clean up
                    await sequelize.query(
                              `DELETE FROM email_otp_requests WHERE email = :email`,
                              { replacements: { email }, type: QueryTypes.DELETE }
                    );

                    return { success: true };
          }
}
