// Upstream shapes — must match instivera-mobile/backend/src/types/payment.types.ts exactly

export interface UpstreamPayment {
  id: string;
  amount: number;
  paid_amount?: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';
  due_date?: string;
  payment_mode?: string;
  merchant_order_id?: string;
  description?: string;
  created_at?: string;
}

export interface UpstreamPaymentListResponse {
  status: 1 | 0;
  data: UpstreamPayment[];
  message: string;
}

export interface UpstreamPaymentDetailResponse {
  status: 1 | 0;
  data: UpstreamPayment;
  message: string;
}

export interface UpstreamInitiateResponse {
  status: 1 | 0;
  data: {
    paymentId: string;
    merchantOrderId: string;
    amount: number;
    redirectUrl: string;
    expiresAt: string;
  };
  message: string;
}

export interface UpstreamPaymentStatusResponse {
  status: 1 | 0;
  data: {
    status: string;
    gateway_status?: string;
    is_completed: boolean;
  };
  message: string;
}
