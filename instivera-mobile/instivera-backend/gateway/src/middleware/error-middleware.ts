import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { ApiError } from '../utils/api-error';
import { sendError } from '../utils/response';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error(
        { error: err, url: req.url, method: req.method },
        'API Error (5xx)',
      );
    }
    sendError(res, err.statusCode, err.message);
  } else {
    logger.error(
      { error: err, url: req.url, method: req.method },
      'Unhandled error',
    );
    sendError(res, 500, 'Internal server error');
  }
};
