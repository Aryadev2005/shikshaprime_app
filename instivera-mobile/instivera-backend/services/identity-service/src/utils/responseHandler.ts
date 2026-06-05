import { Response } from 'express';

interface SuccessResponse<T> {
  status: 1;
  data: T;
  message: string;
}

interface ErrorResponse {
  status: 0;
  data?: any;
  message: string;
}

/**
 * Send success response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200
): void {
  res.status(statusCode).json({
    status: 1,
    data,
    message,
  } as SuccessResponse<T>);
}

/**
 * Send error response
 */
export function sendError(
  res: Response,
  statusCode: number = 400,
  message: string = 'Error',
  data?: any
): void {
  res.status(statusCode).json({
    status: 0,
    data,
    message,
  } as ErrorResponse);
}
