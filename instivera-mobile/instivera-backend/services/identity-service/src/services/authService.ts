import bcrypt from 'bcryptjs';
import { generateToken, JWTPayload } from '../utils/jwt';
import { AppError } from '../utils/appError';
import { getTenantSequelize } from '../db';
import { getTenantModels } from '../models';
import { Op } from 'sequelize';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

interface AttemptRecord {
  count: number;
  lockedUntil: Date | null;
}

export class AuthService {
  /** In-memory brute-force counter keyed by `tenant:username` */
  private loginAttempts = new Map<string, AttemptRecord>();

  private getAttemptKey(tenant: string, username: string): string {
    return `${tenant}:${username.toLowerCase()}`;
  }

  private checkLocked(key: string): void {
    const record = this.loginAttempts.get(key);
    if (!record) return;

    if (record.lockedUntil && record.lockedUntil > new Date()) {
      const remaining = Math.ceil((record.lockedUntil.getTime() - Date.now()) / 60000);
      throw AppError.tooManyRequests(
        `Account temporarily locked due to too many failed attempts. Try again in ${remaining} minute(s).`,
      );
    }

    // Lock expired — reset
    if (record.lockedUntil && record.lockedUntil <= new Date()) {
      this.loginAttempts.delete(key);
    }
  }

  private recordFailure(key: string): void {
    const record = this.loginAttempts.get(key) ?? { count: 0, lockedUntil: null };
    record.count += 1;
    if (record.count >= MAX_ATTEMPTS) {
      record.lockedUntil = new Date(Date.now() + LOCKOUT_MS);
    }
    this.loginAttempts.set(key, record);
  }

  private clearAttempts(key: string): void {
    this.loginAttempts.delete(key);
  }

  /**
   * Login user with username/email and password.
   * Returns JWT token and user info.
   */
  async login(username: string, password: string, tenant: string) {
    const key = this.getAttemptKey(tenant, username);
    this.checkLocked(key);

    try {
      const sequelize = getTenantSequelize(tenant);
      const { User } = getTenantModels(sequelize);

      const user = await User.findOne({
        where: {
          [Op.or]: [{ username }, { email: username }],
        },
      });

      if (!user) {
        this.recordFailure(key);
        throw AppError.unauthorized('Invalid username or password');
      }

      if (!user.is_active) {
        throw AppError.unauthorized('User account is inactive');
      }

      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        this.recordFailure(key);
        throw AppError.unauthorized('Invalid username or password');
      }

      // Successful login — clear failure counter
      this.clearAttempts(key);

      const payload: JWTPayload = {
        user_id: user.id,
        username: user.username,
        role: user.role,
        user_type: user.user_type,
        user_code: user.user_code,
        email: user.email,
      };

      const token = generateToken(payload);

      return {
        token,
        user: {
          user_id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          user_type: user.user_type,
          user_code: user.user_code,
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal('Login failed');
    }
  }

  /**
   * Validate if email exists for a user.
   */
  async validateEmail(email: string, tenant: string) {
    try {
      const sequelize = getTenantSequelize(tenant);
      const { User } = getTenantModels(sequelize);

      const user = await User.findOne({ where: { email } });

      if (!user) {
        return { exists: false, first_name: null, last_name: null };
      }

      return {
        exists: true,
        user_id: user.id,
        first_name: user.username,
        last_name: '',
      };
    } catch (error) {
      throw AppError.internal('Email validation failed');
    }
  }

  /**
   * Change password for a user.
   */
  async changePassword(email: string, newPassword: string, tenant: string) {
    try {
      if (newPassword.length < 8) {
        throw AppError.badRequest('Password must be at least 8 characters');
      }

      const sequelize = getTenantSequelize(tenant);
      const { User } = getTenantModels(sequelize);

      const user = await User.findOne({ where: { email } });
      if (!user) throw AppError.notFound('User not found');

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await user.update({ password_hash: hashedPassword });

      return { message: 'Password changed successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal('Password change failed');
    }
  }
}
