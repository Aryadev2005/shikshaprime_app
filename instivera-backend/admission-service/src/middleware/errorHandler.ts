import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { AppError } from '../utils/appError';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
          console.error('Error:', err);

          // Handle Multer-specific errors (unexpected field, file size, etc.)
          if (err instanceof multer.MulterError) {
                    return res.status(400).json({
                              status: "error",
                              message: err.message, // e.g. "Unexpected field", "File too large"
                              data: { field: err.field ?? null },
                    });
          }

          const statusCode = err instanceof AppError ? err.statusCode : (err.status ?? 500);
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
