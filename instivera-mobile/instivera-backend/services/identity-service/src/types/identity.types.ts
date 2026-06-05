export interface Identity {
    id: string;
    username: string;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateIdentityRequest {
    username: string;
    email: string;
    password: string;
}

export interface UpdateIdentityRequest {
    username?: string;
    email?: string;
    password?: string;
}

export interface IdentityResponse {
    id: string;
    username: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}