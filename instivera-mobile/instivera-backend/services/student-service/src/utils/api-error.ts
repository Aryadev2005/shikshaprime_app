export class ApiError extends Error {
    public status: number;
    public isOperational: boolean;

    constructor(status: number, message: string, isOperational = true) {
        super(message);
        this.status = status;
        this.isOperational = isOperational;

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, ApiError.prototype);
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

    static internal(message: string) {
        return new ApiError(500, message, false);
    }
}