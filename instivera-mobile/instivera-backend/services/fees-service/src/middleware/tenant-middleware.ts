import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      tenant?: string;
      user?: any;
      token?: string;
    }
  }
}

export const tenantMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  // Accept both x-tenant-id (mobile app) and x-tenant (BFF axios client)
  req.tenant =
    (req.headers['x-tenant-id'] as string) ||
    (req.headers['x-tenant'] as string) ||
    'default';
  next();
};
