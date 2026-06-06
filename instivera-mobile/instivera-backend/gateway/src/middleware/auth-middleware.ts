import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { ApiError } from '../utils/api-error';
import { JwtPayload } from '../types';

const VALID_USER_TYPES = new Set(['teacher', 'student', 'admin']);
const REQUIRED_FIELDS: (keyof JwtPayload)[] = ['user_id', 'username', 'role', 'user_code'];

function assertPayload(payload: JwtPayload): void {
  const missing = REQUIRED_FIELDS.filter(
    (f) => payload[f] === undefined || payload[f] === null || payload[f] === '',
  );
  if (missing.length > 0) {
    throw new ApiError(401, `Token missing required fields: ${missing.join(', ')}`);
  }
  if (!VALID_USER_TYPES.has(payload.user_type)) {
    throw new ApiError(403, `Unknown user_type: ${payload.user_type}`);
  }
}

export const requireAuth = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Invalid or expired token');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    assertPayload(decoded);

    req.user = decoded;
    req.token = token;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, 'Invalid or expired token'));
    } else {
      next(error);
    }
  }
};

export const requireRole =
  (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError(401, 'Not authenticated'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ApiError(403, 'Insufficient permissions'));
      return;
    }
    next();
  };
