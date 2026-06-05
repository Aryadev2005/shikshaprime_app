import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../utils/appError';

/**
 * Verify JWT and attach user to request
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Set default tenant if not provided
  (req as any).tenant = (req as any).tenant || 'default';

  next();
};

/**
 * Require authentication - verify JWT token
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
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
    (req as any).user = payload;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Require specific role
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
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
