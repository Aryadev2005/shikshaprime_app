import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../utils/appError';

const VALID_USER_TYPES = new Set(['teacher', 'student', 'admin']);
const REQUIRED_FIELDS = ['user_id', 'username', 'role', 'user_code'] as const;

function assertPayload(payload: any): void {
  const missing = REQUIRED_FIELDS.filter((f) => payload[f] === undefined || payload[f] === null || payload[f] === '');
  if (missing.length > 0) {
    throw AppError.unauthorized(`Token missing required fields: ${missing.join(', ')}`);
  }
  if (!VALID_USER_TYPES.has(payload.user_type)) {
    throw AppError.forbidden(`Unknown user_type: ${payload.user_type}`);
  }
}

/** Sets default tenant — does NOT verify JWT (identity-service is the issuer) */
export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  (req as any).tenant = (req as any).tenant || 'default';
  next();
};

/** Verify JWT and validate required payload fields */
export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw AppError.unauthorized('Missing authorization header');
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw AppError.unauthorized('Invalid authorization header format');
    }

    const payload = verifyToken(token);
    assertPayload(payload);
    (req as any).user = payload;

    next();
  } catch (error) {
    next(error);
  }
};

/** Require a specific role after requireAuth */
export const requireRole = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return next(AppError.unauthorized('Not authenticated'));
    }

    if (!roles.includes(user.role)) {
      return next(AppError.forbidden(`Access denied for role: ${user.role}`));
    }

    next();
  };
};
