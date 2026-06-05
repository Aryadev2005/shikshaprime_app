import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err); // Log the error for debugging

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    sendError(res, statusCode, message);
};

export default errorMiddleware;