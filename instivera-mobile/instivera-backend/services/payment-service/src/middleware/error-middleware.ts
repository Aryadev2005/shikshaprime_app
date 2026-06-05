import { Request, Response, NextFunction } from 'express';

export const errorMiddleware = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: 0,
    data: null,
    message: err.message || 'Internal Server Error',
  });
};

export default errorMiddleware;
