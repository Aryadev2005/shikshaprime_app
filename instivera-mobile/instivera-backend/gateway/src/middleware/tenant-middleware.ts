import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const tenantMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const tenant = req.headers['x-tenant'] as string | undefined || req.query.tenant as string | undefined;

  if (!tenant) {
    sendError(res, 400, 'x-tenant header is required');
    return;
  }

  req.tenant = tenant;
  next();
};
