import { AppError } from "../utils/appError";
import { RbacServiceError } from "../services/rbacService";

export function errorHandler(err, req, res, next) {
  console.error("Error:", err.message);

  const statusCode =
    err instanceof AppError || err instanceof RbacServiceError
      ? err.statusCode
      : 500;

  const message =
    err instanceof AppError || err instanceof RbacServiceError
      ? err.message
      : "Internal Server Error";

  res.status(statusCode).json({
    status: 0,
    error: message,
    message: message,
  });
}