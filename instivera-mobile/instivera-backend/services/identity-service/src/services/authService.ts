import bcrypt from 'bcryptjs';
import { generateToken, JWTPayload } from '../utils/jwt';
import { AppError } from '../utils/appError';
import { getTenantSequelize } from '../db';
import { getTenantModels } from '../models';
import { Op } from 'sequelize';

export class AuthService {
  /**
   * Login user with username/email and password
   * Returns JWT token and user info
   */
  async login(username: string, password: string, tenant: string) {
    try {
      const sequelize = getTenantSequelize(tenant);
      const { User } = getTenantModels(sequelize);

      // Find user by username or email
      const user = await User.findOne({
        where: {
          [Op.or]: [{ username }, { email: username }],
        },
      });

      if (!user) {
        throw AppError.unauthorized('Invalid username or password');
      }

      if (!user.is_active) {
        throw AppError.unauthorized('User account is inactive');
      }

      // Compare passwords
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        throw AppError.unauthorized('Invalid username or password');
      }

      // Generate JWT token
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
   * Validate if email exists for a user
   * Returns user existence status and basic info
   */
  async validateEmail(email: string, tenant: string) {
    try {
      const sequelize = getTenantSequelize(tenant);
      const { User } = getTenantModels(sequelize);

      const user = await User.findOne({
        where: { email },
      });

      if (!user) {
        return {
          exists: false,
          first_name: null,
          last_name: null,
        };
      }

      return {
        exists: true,
        user_id: user.id,
        first_name: user.username, // Using username as display name for now
        last_name: '',
      };
    } catch (error) {
      throw AppError.internal('Email validation failed');
    }
  }

  /**
   * Change password for a user
   */
  async changePassword(email: string, newPassword: string, tenant: string) {
    try {
      if (newPassword.length < 6) {
        throw AppError.badRequest('Password must be at least 6 characters');
      }

      const sequelize = getTenantSequelize(tenant);
      const { User } = getTenantModels(sequelize);

      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw AppError.notFound('User not found');
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      await user.update({ password_hash: hashedPassword });

      return { message: 'Password changed successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal('Password change failed');
    }
  }
}
