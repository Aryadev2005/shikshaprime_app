import { AppError } from "../utils/appError";

export function errorHandler(err, req, res, next) {
  console.error("Error:", err.message);

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof AppError ? err.message : "Internal Server Error";

  res.status(statusCode).json({
    status: 0,
    error: message,
  });
}