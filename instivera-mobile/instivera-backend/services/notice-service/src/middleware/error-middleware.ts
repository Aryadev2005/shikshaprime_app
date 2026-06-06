import { Request, Response, NextFunction } from 'express';

export const errorMiddleware = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  const isProd = process.env.NODE_ENV === 'production';
  const status = err.status || 500;

  if (!isProd) {
    console.error(err.stack);
  }

  res.status(status).json({
    status: 0,
    data: null,
    message: isProd && status >= 500 ? 'Internal server error' : err.message || 'Internal server error',
  });
};
