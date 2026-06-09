import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { getTenantModels } from '../../models';
import { AppError } from '../../utils/appError';
import { sendOtpEmail } from '../../utils/emailService';
import logger from '../../utils/logger';

const EXPIRY_MINUTES = 10;
const MAX_VERIFY_ATTEMPTS = 3;
const SEND_COOLDOWN_MS = 60 * 1000;

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export class OtpService {
  static async sendEmailOtp(email: string, tenant: string) {
    const { OtpRequest } = getTenantModels(tenant);

    // Rate-limit: prevent spamming
    const recent = await OtpRequest.findOne({
      where: {
        email,
        is_used: 0,
        created_at: { [Op.gte]: new Date(Date.now() - SEND_COOLDOWN_MS) } as any,
      },
      order: [['created_at', 'DESC']],
    });
    if (recent) {
      throw AppError.tooManyRequests('Please wait 60 seconds before requesting another OTP');
    }

    const otp = generateOtp();
    const otp_hash = await bcrypt.hash(otp, 10);
    const expires_at = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);

    await OtpRequest.create({ email, otp_hash, expires_at, attempts: 0, is_used: 0 });

    await sendOtpEmail(email, otp);
    logger.info({ email }, 'OTP sent');
    return { message: 'OTP sent to your email address' };
  }

  static async verifyEmailOtp(email: string, otp: string, tenant: string) {
    const { OtpRequest } = getTenantModels(tenant);

    const request = await OtpRequest.findOne({
      where: { email, is_used: 0, expires_at: { [Op.gt]: new Date() } as any },
      order: [['created_at', 'DESC']],
    });

    if (!request) {
      throw AppError.badRequest('OTP has expired or was already used. Please request a new one.');
    }

    if (request.attempts >= MAX_VERIFY_ATTEMPTS) {
      throw AppError.tooManyRequests('Too many incorrect attempts. Please request a new OTP.');
    }

    const match = await bcrypt.compare(otp, request.otp_hash);
    if (!match) {
      await request.update({ attempts: request.attempts + 1 });
      throw AppError.badRequest('Invalid OTP');
    }

    await request.update({ is_used: 1 });
    return { message: 'OTP verified successfully' };
  }
}
