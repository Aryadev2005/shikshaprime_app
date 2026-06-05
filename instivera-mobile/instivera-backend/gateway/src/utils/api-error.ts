export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, new.target.prototype);
    if (typeof (Error as unknown as Record<string, unknown>)['captureStackTrace'] === 'function') {
      (Error as unknown as { captureStackTrace: (t: object, c: object) => void })
        .captureStackTrace(this, this.constructor);
    }
  }
}
