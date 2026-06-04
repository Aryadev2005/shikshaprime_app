// Upstream payment-service shapes

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

// Upstream fees-management-service shapes

export interface UpstreamFeesDue {
  id: string;
  fee_head_name: string;
  amount: number;
  paid_amount: number;
  balance: number;
  due_date: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';
}

export interface UpstreamFeesDuesResponse {
  status: 1 | 0;
  data: {
    dues: UpstreamFeesDue[];
  };
  message: string;
}

export interface UpstreamReceipt {
  id: string;
  receipt_number?: string;
  date: string;
  amount: number;
  payment_mode: string;
  description?: string;
}

export interface UpstreamReceiptsResponse {
  status: 1 | 0;
  data: UpstreamReceipt[];
  message: string;
}

export interface UpstreamLedgerEntry {
  date: string;
  description: string;
  debit?: number;
  credit?: number;
  balance: number;
}

export interface UpstreamLedgerResponse {
  status: 1 | 0;
  data: {
    entries: UpstreamLedgerEntry[];
    openingBalance?: number;
    closingBalance?: number;
  };
  message: string;
}

// Mobile DTO types

export interface MobileOutstanding {
  totalAmount: number;
  currency: 'INR';
  dueDate: string | null;
  isOverdue: boolean;
}

export interface MobileBreakdownItem {
  label: string;
  amount: number;
  paidAmount: number;
  balance: number;
  status: string;
  dueDate: string;
}

export interface MobileRecentPayment {
  label: string;
  date: string;
  mode: string;
  amount: number;
}

export interface MobilePaymentSummary {
  outstanding: MobileOutstanding;
  annualTotal: number;
  paidSoFar: number;
  primaryPaymentId: string | null;
  breakdown: MobileBreakdownItem[];
  recentPayments: MobileRecentPayment[];
}

export interface MobileReceipt {
  id: string;
  receiptNumber: string;
  date: string;
  amount: number;
  mode: string;
  description: string;
}

export interface MobileInitiateResult {
  paymentId: string;
  merchantOrderId: string;
  amount: number;
  redirectUrl: string;
  expiresAt: string;
}

export interface MobilePaymentStatus {
  status: string;
  gatewayStatus: string | null;
  isCompleted: boolean;
}

export interface MobileLedgerEntry {
  date: string;
  description: string;
  debit?: number;
  credit?: number;
  balance: number;
}

export interface MobileLedger {
  entries: MobileLedgerEntry[];
  openingBalance: number;
  closingBalance: number;
}

// Request types

export interface InitiatePaymentRequest {
  paymentId: string;
  amount?: number;
}
