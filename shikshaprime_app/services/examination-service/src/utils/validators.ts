import { AppError } from "./appError";

export function requireFields(data: any, fields: string[]): void {
  const missing = fields.filter((f) => {
    const val = data[f];
    return val === undefined || val === null || val === "";
  });
  if (missing.length > 0) {
    throw new AppError(`Missing required fields: ${missing.join(", ")}`, 400);
  }
}

export function isPositiveNumber(val: any, fieldName: string): void {
  const num = Number(val);
  if (isNaN(num) || num <= 0) {
    throw new AppError(`${fieldName} must be a positive number`, 400);
  }
}

export function isValidEnum(val: any, allowed: string[], fieldName: string): void {
  if (!allowed.includes(val)) {
    throw new AppError(`${fieldName} must be one of: ${allowed.join(", ")}`, 400);
  }
}