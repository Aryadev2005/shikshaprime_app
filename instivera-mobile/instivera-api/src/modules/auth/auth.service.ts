import bcrypt from 'bcryptjs';
import { getTenantModels } from '../../models';
import { AppError } from '../../utils/appError';
import { generateToken } from '../../utils/jwt';

// In-memory brute-force protection per tenant+username key
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function buildKey(tenant: string, username: string) {
  return `${tenant}:${username}`;
}

export class AuthService {
  static async login(username: string, password: string, tenant: string) {
    const key = buildKey(tenant, username);
    const record = loginAttempts.get(key);
    if (record && record.lockedUntil > Date.now()) {
      throw AppError.tooManyRequests('Account temporarily locked due to too many failed attempts');
    }

    const { User } = getTenantModels(tenant);
    const user = await User.findOne({ where: { username, is_active: 1 } });

    if (!user) {
      throw AppError.unauthorized('Invalid username or password');
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      const current = loginAttempts.get(key) || { count: 0, lockedUntil: 0 };
      current.count += 1;
      if (current.count >= MAX_ATTEMPTS) {
        current.lockedUntil = Date.now() + LOCKOUT_MS;
        current.count = 0;
      }
      loginAttempts.set(key, current);
      throw AppError.unauthorized('Invalid username or password');
    }

    loginAttempts.delete(key);

    const token = generateToken({
      user_id: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
      user_code: user.user_code,
      user_type: user.user_type,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        user_type: user.user_type,
        user_code: user.user_code,
      },
    };
  }

  static async validateEmail(email: string, tenant: string) {
    const { User } = getTenantModels(tenant);
    const user = await User.findOne({ where: { email, is_active: 1 } });
    if (!user) throw AppError.notFound('No account found with that email address');
    return { message: 'Email is valid' };
  }

  static async changePassword(email: string, newPassword: string, tenant: string) {
    const { User } = getTenantModels(tenant);
    const user = await User.findOne({ where: { email, is_active: 1 } });
    if (!user) throw AppError.notFound('User not found');
    const hash = await bcrypt.hash(newPassword, 10);
    await user.update({ password_hash: hash });
    return { message: 'Password changed successfully' };
  }
}
