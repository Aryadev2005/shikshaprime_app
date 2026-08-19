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

// email_otp_requests has no is_used flag and otp_code (varchar(10)) is too short to hold a
// bcrypt hash, so a request is "used" by deleting its row once verified, and the code is
// compared directly rather than hashed.
export class OtpService {
  static async sendEmailOtp(email: string, tenant: string) {
    const { EmailOtpRequest } = getTenantModels(tenant);

    // Rate-limit: prevent spamming
    const recent = await EmailOtpRequest.findOne({
      where: {
        email,
        created_at: { [Op.gte]: new Date(Date.now() - SEND_COOLDOWN_MS) } as any,
      },
      order: [['created_at', 'DESC']],
    });
    if (recent) {
      throw AppError.tooManyRequests('Please wait 60 seconds before requesting another OTP');
    }

    const otp_code = generateOtp();
    const expires_at = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);

    await EmailOtpRequest.create({ email, otp_code, expires_at, attempts: 0 });

    await sendOtpEmail(email, otp_code);
    logger.info({ email }, 'OTP sent');
    return { message: 'OTP sent to your email address' };
  }

  static async verifyEmailOtp(email: string, otp: string, tenant: string) {
    const { EmailOtpRequest } = getTenantModels(tenant);

    const request = await EmailOtpRequest.findOne({
      where: { email, expires_at: { [Op.gt]: new Date() } as any },
      order: [['created_at', 'DESC']],
    });

    if (!request) {
      throw AppError.badRequest('OTP has expired or was already used. Please request a new one.');
    }

    if ((request.attempts ?? 0) >= MAX_VERIFY_ATTEMPTS) {
      throw AppError.tooManyRequests('Too many incorrect attempts. Please request a new OTP.');
    }

    if (request.otp_code !== otp) {
      await request.update({ attempts: (request.attempts ?? 0) + 1 });
      throw AppError.badRequest('Invalid OTP');
    }

    await request.destroy();
    return { message: 'OTP verified successfully' };
  }
}
