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

    static badRequest(message: string) {
        return new ApiError(400, message);
    }

    static unauthorized(message: string) {
        return new ApiError(401, message);
    }

    static forbidden(message: string) {
        return new ApiError(403, message);
    }

    static notFound(message: string) {
        return new ApiError(404, message);
    }

    static internalServerError(message: string) {
        return new ApiError(500, message, false);
    }
}