// Upstream shapes — must match instivera-mobile/backend/src/types/payment.types.ts exactly

export interface UpstreamFeesDue {
  id: string;
  fee_head_name: string;
  amount: number;
  paid_amount: number;
  balance: number;
  due_date: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';
}

export interface UpstreamReceipt {
  id: string;
  receipt_number?: string;
  date: string;
  amount: number;
  payment_mode: string;
  description?: string;
}

export interface UpstreamLedgerEntry {
  date: string;
  description: string;
  debit?: number;
  credit?: number;
  balance: number;
}
