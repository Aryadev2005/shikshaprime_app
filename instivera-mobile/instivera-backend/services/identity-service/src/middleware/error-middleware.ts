import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

/**
 * Global error handling middleware
 */
export const errorMiddleware = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.error(`API Error (${err.statusCode}): ${err.message}`);
    return res.status(err.statusCode).json({
      status: 0,
      data: null,
      message: err.message,
    });
  }

  // Unknown error
  logger.error('Unexpected error:', err);
  return res.status(500).json({
    status: 0,
    data: null,
    message: 'Internal server error',
  });
};
