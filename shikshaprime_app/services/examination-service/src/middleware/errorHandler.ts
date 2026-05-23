import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
          console.error('Error:', err);

          const statusCode = err instanceof AppError ? err.statusCode : 500;
          let message = err.message || 'Internal server error';
          let data = null;

          if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
                    message = (err.name === 'SequelizeUniqueConstraintError') ? 'Duplicate entry' : 'Validation error';
                    data = err.errors?.map((e: any) => e.message);
          }

          return res.status(statusCode).json({
                    status: "error",
                    message: message,
                    data: data,
          });
}
