import { Request, Response, NextFunction } from 'express';

export const tenantMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  req.tenant =
    (req.headers['x-tenant-id'] as string) ||
    (req.headers['x-tenant'] as string) ||
    'default';
  next();
};
