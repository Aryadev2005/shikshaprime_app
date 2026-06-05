import { Request, Response, NextFunction } from 'express';

export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';

    res.status(status).json({
        status: 0,
        data: null,
        message: message,
    });
};