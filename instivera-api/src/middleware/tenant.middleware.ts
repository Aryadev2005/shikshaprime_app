import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const tenantMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const headers = req.headers as Record<string, string | string[] | undefined>;
  const rawTenant = headers['x-tenant'];
  const tenant =
    (Array.isArray(rawTenant) ? rawTenant[0] : rawTenant) ??
    (req.query['tenant'] as string | undefined);

  if (!tenant) {
    sendError(res, 400, 'x-tenant header is required');
    return;
  }

  req.tenant = tenant;
  next();
};
