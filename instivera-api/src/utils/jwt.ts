import jwt from 'jsonwebtoken';
import config from '../config';
import { AuthUser } from '../types';

export function generateToken(payload: object, expiresIn?: string): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: (expiresIn || '60d') as any });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, config.jwtSecret) as AuthUser;
  } catch {
    return null;
  }
}
