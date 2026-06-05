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

export const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const tenant = req.headers['x-tenant-id'] as string || 'default';
  req.tenant = tenant;
  next();
};
