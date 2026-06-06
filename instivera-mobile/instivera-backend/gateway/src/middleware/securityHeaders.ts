import { Request, Response, NextFunction } from 'express';

/** Adds security headers to every /api/mobile/* response */
export const securityHeaders = (
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  next();
};
