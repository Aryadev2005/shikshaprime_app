export interface Outstanding {
  totalAmount: number;
  currency: 'INR';
  dueDate: string | null;
  isOverdue: boolean;
}

export interface BreakdownItem {
  label: string;
  amount: number;
  paidAmount: number;
  balance: number;
  status: string;
  dueDate: string;
}

export interface RecentPayment {
  label: string;
  date: string;
  mode: string;
  amount: number;
}

export interface PaymentSummary {
  outstanding: Outstanding;
  annualTotal: number;
  paidSoFar: number;
  primaryPaymentId: string | null;
  breakdown: BreakdownItem[];
  recentPayments: RecentPayment[];
}

export interface PaymentReceipt {
  id: string;
  receiptNumber: string;
  date: string;
  amount: number;
  mode: string;
  description: string;
}

export interface InitiatePaymentResult {
  paymentId: string;
  merchantOrderId: string;
  amount: number;
  redirectUrl: string;
  expiresAt: string;
}

export interface PaymentStatus {
  status: string;
  gatewayStatus: string | null;
  isCompleted: boolean;
}

export interface InitiatePaymentInput {
  paymentId: string;
  amount?: number;
}
