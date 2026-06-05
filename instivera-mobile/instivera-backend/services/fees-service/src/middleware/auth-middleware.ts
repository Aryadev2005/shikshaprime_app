import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ status: 0, data: null, message: 'No token provided' });
  }
  try {
    req.user = jwt.verify(token, config.jwt_secret) as any;
    req.token = token;
    next();
  } catch {
    return res.status(403).json({ status: 0, data: null, message: 'Invalid or expired token' });
  }
};

export const requireAuth = authMiddleware;
