export interface AuthRequest {
    username: string;
    password: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
}

export interface User {
    id: string;
    username: string;
    email: string;
    role: string;
}

export interface TokenPayload {
    userId: string;
    username: string;
    role: string;
}