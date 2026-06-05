import bcrypt from 'bcryptjs';
import { AppError } from '../utils/appError';
import { getTenantSequelize } from '../db';
import { getTenantModels } from '../models';

/**
 * Generate 6-digit OTP
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export class OtpService {
  /**
   * Send OTP email
   * Generates OTP, hashes it, and stores in database
   */
  async sendEmailOtp(email: string, tenant: string) {
    try {
      const sequelize = getTenantSequelize(tenant);
      const { OtpRequest } = getTenantModels(sequelize);

      // Rate limiting: Check if OTP was sent recently (60 seconds)
      const recentOtp = await OtpRequest.findOne({
        where: { email },
        order: [['created_at', 'DESC']],
      });

      if (recentOtp) {
        const timeDiff = Date.now() - recentOtp.created_at!.getTime();
        if (timeDiff < 60000) {
          throw AppError.tooManyRequests('Please wait 60 seconds before requesting another OTP');
        }
      }

      // Generate OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Hash OTP
      const saltRounds = 10;
      const otpHash = await bcrypt.hash(otp, saltRounds);

      // Delete old OTPs for this email
      await OtpRequest.destroy({ where: { email } });

      // Create new OTP record
      await OtpRequest.create({
        email,
        otp_hash: otpHash,
        expires_at: expiresAt,
        attempts: 0,
        is_used: 0,
      });

      return {
        otp, // Return plain OTP to send via email (in dev mode)
        expiresAt,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to send OTP');
    }
  }

  /**
   * Verify OTP
   * Checks OTP validity, expiry, and attempts
   */
  async verifyEmailOtp(email: string, otp: string, tenant: string) {
    try {
      const sequelize = getTenantSequelize(tenant);
      const { OtpRequest } = getTenantModels(sequelize);

      // Find most recent OTP for this email
      const otpRecord = await OtpRequest.findOne({
        where: { email },
        order: [['created_at', 'DESC']],
      });

      if (!otpRecord) {
        throw AppError.badRequest('No OTP found. Please request a new one.');
      }

      // Check if expired
      if (new Date() > otpRecord.expires_at) {
        await otpRecord.destroy();
        throw AppError.badRequest('OTP has expired. Please request a new one.');
      }

      // Check attempts limit (max 3)
      if (otpRecord.attempts >= 3) {
        await otpRecord.destroy();
        throw AppError.badRequest('Too many failed attempts. Please request a new OTP.');
      }

      // Check if already used
      if (otpRecord.is_used) {
        throw AppError.badRequest('OTP has already been used.');
      }

      // Verify OTP hash
      const otpMatch = await bcrypt.compare(otp, otpRecord.otp_hash);

      if (!otpMatch) {
        // Increment attempts
        await otpRecord.update({ attempts: otpRecord.attempts + 1 });
        const attemptsLeft = 3 - otpRecord.attempts - 1;
        return {
          success: false,
          attemptsLeft: Math.max(0, attemptsLeft),
        };
      }

      // OTP matched - mark as used
      await otpRecord.update({ is_used: 1 });

      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal('OTP verification failed');
    }
  }
}
