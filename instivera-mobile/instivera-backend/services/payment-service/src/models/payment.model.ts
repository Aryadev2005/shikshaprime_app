export interface Payment {
    id: string;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed';
    createdAt: Date;
    updatedAt: Date;
}

export class PaymentModel {
    constructor(public payment: Payment) {}

    // Additional methods related to payment can be added here
}