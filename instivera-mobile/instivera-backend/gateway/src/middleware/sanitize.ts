import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';

// Patterns that indicate SQL injection attempts in query params
const SQL_INJECTION_RE =
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|EXEC|UNION|CAST|CONVERT)\b|--|;'|'\s*OR\s*'?1'?\s*=\s*'?1)/i;

// Patterns that indicate XSS / script injection in body strings
const SCRIPT_INJECT_RE = /<script[\s\S]*?>|javascript\s*:|on\w+\s*=|<\s*\/?\s*iframe/i;

/** Strip HTML tags from a string value */
function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, '');
}

/** Recursively sanitize all string fields in an object */
function sanitizeObject(obj: unknown): unknown {
  if (typeof obj === 'string') {
    if (SCRIPT_INJECT_RE.test(obj)) return '[removed]';
    return stripHtml(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (obj !== null && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      sanitized[key] = sanitizeObject(val);
    }
    return sanitized;
  }
  return obj;
}

/** Check all query parameter values for SQL injection patterns */
function hasSqlInjection(query: Record<string, unknown>): boolean {
  return Object.values(query).some(
    (v) => typeof v === 'string' && SQL_INJECTION_RE.test(v),
  );
}

export const sanitizeRequest = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  if (req.query && hasSqlInjection(req.query as Record<string, unknown>)) {
    next(new ApiError(400, 'Invalid query parameters'));
    return;
  }

  next();
};
