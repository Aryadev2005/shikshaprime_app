class ApiError extends Error {
    public status: number;
    public isOperational: boolean;

    constructor(message: string, status: number, isOperational: boolean = true) {
        super(message);
        this.status = status;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message: string) {
        return new ApiError(message, 400);
    }

    static unauthorized(message: string) {
        return new ApiError(message, 401);
    }

    static forbidden(message: string) {
        return new ApiError(message, 403);
    }

    static notFound(message: string) {
        return new ApiError(message, 404);
    }

    static internal(message: string) {
        return new ApiError(message, 500);
    }
}

export default ApiError;