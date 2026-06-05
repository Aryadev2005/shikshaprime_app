import { Request, Response, NextFunction } from 'express';

const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';

    res.status(status).json({
        status: 'error',
        statusCode: status,
        message: message,
    });
};

export default errorMiddleware;