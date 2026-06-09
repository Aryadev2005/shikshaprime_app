import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { AppError } from '../utils/appError';
import { verifyToken } from '../utils/jwt';
import { AuthUser, JwtPayload } from '../types';

const VALID_USER_TYPES = new Set(['teacher', 'student', 'admin']);
const REQUIRED_FIELDS: (keyof JwtPayload)[] = ['user_id', 'username', 'role', 'user_code'];

function assertPayload(payload: JwtPayload): void {
  const missing = REQUIRED_FIELDS.filter(
    (f) => payload[f] === undefined || payload[f] === null || payload[f] === '',
  );
  if (missing.length > 0) {
    throw new AppError(`Token missing required fields: ${missing.join(', ')}`, 401);
  }
  if (!VALID_USER_TYPES.has(payload.user_type)) {
    throw new AppError(`Unknown user_type: ${payload.user_type}`, 403);
  }
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Invalid or expired token', 401);
    }
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    assertPayload(decoded);
    req.user = decoded;
    req.token = token;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid or expired token', 401));
    } else {
      next(error);
    }
  }
};

export const requireRole =
  (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) { next(new AppError('Not authenticated', 401)); return; }
    if (!roles.includes(req.user.role!)) { next(new AppError('Insufficient permissions', 403)); return; }
    next();
  };

export const verifyTokenFromSocket = (token: string): AuthUser | null => {
  return verifyToken(token);
};
