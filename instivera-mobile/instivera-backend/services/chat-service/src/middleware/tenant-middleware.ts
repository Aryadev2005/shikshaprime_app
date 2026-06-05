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
  req.tenant = (req.headers['x-tenant-id'] as string) || 'default';
  next();
};
