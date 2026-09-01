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
  /**
   * No backend source: `payment_method` lives on `payment_transactions`, which
   * no student-facing endpoint returns. Undefined until one does.
   */
  mode?: string;
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
  /** See RecentPayment.mode — receipts/modes are not exposed to students. */
  receiptNumber?: string;
  date: string;
  amount: number;
  mode?: string;
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
  /**
   * A fee-ASSIGNMENT id (`student_fee_assignments.id`), which is what
   * `POST /api/payment/students/:assignmentId/initiate` takes — not the
   * `paymentId` that comes back in InitiatePaymentResult. Kept under this name
   * to match PaymentSummary.primaryPaymentId.
   */
  paymentId: string;
  amount?: number;
}
