export class ApiError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(statusCode: number, message: string, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        // Capture the stack trace for debugging
        Error.captureStackTrace(this, this.constructor);
    }

    static createValidationError(message: string) {
        return new ApiError(400, message);
    }

    static createNotFoundError(message: string) {
        return new ApiError(404, message);
    }

    static createUnauthorizedError(message: string) {
        return new ApiError(401, message);
    }

    static createInternalServerError(message: string) {
        return new ApiError(500, message);
    }
}