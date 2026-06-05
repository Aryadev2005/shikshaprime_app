export interface Notification {
    id: string;
    userId: string;
    message: string;
    type: 'info' | 'warning' | 'error';
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateNotificationDto {
    userId: string;
    message: string;
    type: 'info' | 'warning' | 'error';
}

export interface UpdateNotificationDto {
    message?: string;
    type?: 'info' | 'warning' | 'error';
}