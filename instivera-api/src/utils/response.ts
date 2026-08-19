import { Response } from 'express';

export interface ApiResponse<T = any> {
  status: 1 | 0;
  data: T | null;
  message: string;
}

export const sendSuccess = <T = any>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200,
): Response =>
  res.status(statusCode).json({ status: 1, data, message } as ApiResponse<T>);

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  extra?: Record<string, unknown>,
): Response =>
  res.status(statusCode).json({ status: 0, data: extra ?? null, message } as ApiResponse<null>);
