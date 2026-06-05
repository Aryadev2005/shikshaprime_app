export interface Notification {
    id: string;
    userId: string;
    message: string;
    type: 'info' | 'warning' | 'error';
    createdAt: Date;
    updatedAt: Date;
}