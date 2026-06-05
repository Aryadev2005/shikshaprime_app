import jwt from 'jsonwebtoken';
import config from '../config';

export interface JWTPayload {
  user_id: number;
  username: string;
  role: string;
  user_type: string;
  user_code: string;
  email: string;
}

/**
 * Generate JWT token
 * @param payload JWT payload
 * @returns JWT token
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, config.jwt_secret, {
    expiresIn: config.jwt_expires_in as unknown as number,
  });
}

/**
 * Verify JWT token
 * @param token JWT token
 * @returns Decoded payload
 */
export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, config.jwt_secret) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
