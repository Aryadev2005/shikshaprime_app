import { Request, Response, NextFunction } from 'express';
import { ValidationError, UniqueConstraintError } from 'sequelize';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { AppError } from '../utils/appError';
import logger from '../utils/logger';

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const isDev = process.env.NODE_ENV !== 'production';

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, url: req.url, method: req.method }, err.message);
    }
    res.status(err.statusCode).json({
      status: 0,
      data: null,
      message: err.message,
      ...(isDev && { stack: err.stack }),
    });
    return;
  }

  if (err instanceof ValidationError || err instanceof UniqueConstraintError) {
    res.status(400).json({
      status: 0,
      data: null,
      message: err.message,
      ...(isDev && { stack: err.stack }),
    });
    return;
  }

  if (err instanceof JsonWebTokenError || err instanceof TokenExpiredError) {
    res.status(401).json({
      status: 0,
      data: null,
      message: 'Invalid or expired token',
    });
    return;
  }

  logger.error({ err, url: req.url, method: req.method }, 'Unhandled error');
  res.status(500).json({
    status: 0,
    data: null,
    message: 'Internal server error',
    ...(isDev && { stack: err.stack }),
  });
};
