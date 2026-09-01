import { apiClient } from '../client';
import { ApiResponse } from '../../types/api';
import {
  PaymentSummary,
  PaymentReceipt,
  BreakdownItem,
  RecentPayment,
  InitiatePaymentResult,
  PaymentStatus,
  InitiatePaymentInput,
} from '../../types/payment';

const client = apiClient.getClient();

// ── payment-service shapes ───────────────────────────────────────────────────
//
// Two parallel fee tables are exposed, and the app needs both ids:
//   • student_fee_assignments  → GET /api/payment/students/assignments
//     Keyed `assignment_id`. This is the id `POST /students/:assignmentId/initiate`
//     takes, so it is what drives the "Pay now" button.
//   • student_fee_payments     → GET /api/payment/students
//     Keyed `payment_id`. This is the id `GET /students/:paymentId/status`
//     takes, and it is what `initiate` hands back as `paymentId`.
//
// They share no key in either payload, so they cannot be joined client-side.
// The summary is therefore built from the assignments list alone.
//
// Both endpoints self-scope: when the caller's role is `student` they filter on
// `st.user_id = <token user_id>`. No student id needs to be resolved first.

interface RawFeeAssignmentRow {
  assignment_id: number;
  amount: string | number;
  discount_amount?: string | number | null;
  fine_amount?: string | number | null;
  status?: 'PENDING' | 'PARTIAL' | 'PAID' | '' | string;
  due_date?: string | null;
  paid_date?: string | null;
  fee_head_id?: number;
  fee_head_name?: string | null;
}

interface RawStudentPaymentRow {
  payment_id: number;
  amount: string | number;
  paid_amount?: string | number | null;
  status?: string;
  paid_date?: string | null;
  due_date?: string | null;
  payment_type_name?: string | null;
}

const num = (v: string | number | null | undefined): number => Number(v ?? 0) || 0;

// amount − discount + fine. student_fee_assignments stores no paid_amount, so a
// PARTIAL row's paid portion is unknowable here — see INTEGRATION_LOG.md.
const netAmount = (row: RawFeeAssignmentRow): number =>
  num(row.amount) - num(row.discount_amount) + num(row.fine_amount);

const isPaid = (row: RawFeeAssignmentRow): boolean =>
  String(row.status ?? '').toUpperCase() === 'PAID';

const isPastDue = (dueDate?: string | null): boolean =>
  !!dueDate && new Date(dueDate) < new Date();

// The backend enum is PENDING | PARTIAL | PAID | ''. OVERDUE is derived here:
// there is no such status server-side, but FeeRow renders one.
const rowStatus = (row: RawFeeAssignmentRow): string => {
  if (isPaid(row)) return 'PAID';
  if (isPastDue(row.due_date)) return 'OVERDUE';
  return String(row.status ?? '').toUpperCase() || 'PENDING';
};

const toBreakdownItem = (row: RawFeeAssignmentRow): BreakdownItem => {
  const total = netAmount(row);
  const paidAmount = isPaid(row) ? total : 0;
  return {
    label: row.fee_head_name ?? 'Fee',
    amount: total,
    paidAmount,
    balance: total - paidAmount,
    status: rowStatus(row),
    dueDate: row.due_date ?? '',
  };
};

const toRecentPayment = (row: RawFeeAssignmentRow): RecentPayment => ({
  label: row.fee_head_name ?? 'Fee',
  date: row.paid_date ?? '',
  amount: netAmount(row),
  // `mode` has no source: payment_method lives on payment_transactions, which
  // no student-facing endpoint returns. Left undefined rather than invented.
});

export const paymentApi = {
  /**
   * Assembled client-side from the student's own fee assignments. There is no
   * server-side summary endpoint for students — `/api/payment/dashboard/stats`
   * is institution-wide (see INTEGRATION_LOG.md) — but every figure below is
   * summed from real rows; nothing is defaulted or padded.
   */
  async getPaymentSummary(): Promise<PaymentSummary> {
    const response = await client.get<ApiResponse<RawFeeAssignmentRow[]>>(
      '/api/payment/students/assignments',
    );
    const rows = response.data.data ?? [];

    const paidRows = rows.filter(isPaid);
    const unpaidRows = rows.filter((r) => !isPaid(r));

    const annualTotal = rows.reduce((sum, r) => sum + netAmount(r), 0);
    const paidSoFar = paidRows.reduce((sum, r) => sum + netAmount(r), 0);

    // Earliest-due unpaid row drives both the headline due date and which
    // assignment "Pay now" opens.
    const nextDue = unpaidRows
      .filter((r) => r.due_date)
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())[0];
    const primary = nextDue ?? unpaidRows[0];

    return {
      outstanding: {
        totalAmount: annualTotal - paidSoFar,
        currency: 'INR',
        dueDate: nextDue?.due_date ?? null,
        isOverdue: isPastDue(nextDue?.due_date),
      },
      annualTotal,
      paidSoFar,
      // NOTE: a fee-ASSIGNMENT id, not a payment id — that is what
      // `initiatePayment` needs in its path. See the header comment.
      primaryPaymentId: primary ? String(primary.assignment_id) : null,
      breakdown: rows.map(toBreakdownItem),
      recentPayments: paidRows
        .filter((r) => r.paid_date)
        .sort((a, b) => new Date(b.paid_date!).getTime() - new Date(a.paid_date!).getTime())
        .map(toRecentPayment),
    };
  },

  /**
   * `student_fee_payments` for the caller. Receipt numbers and payment modes
   * live on `payment_transactions`, which no student-facing endpoint exposes,
   * so both fields are omitted rather than faked.
   */
  async getPaymentHistory(): Promise<PaymentReceipt[]> {
    const response = await client.get<ApiResponse<RawStudentPaymentRow[]>>(
      '/api/payment/students',
    );
    return (response.data.data ?? []).map((row) => ({
      id: String(row.payment_id),
      date: row.paid_date ?? '',
      amount: num(row.paid_amount) || num(row.amount),
      description: row.payment_type_name ?? 'Fee payment',
    }));
  },

  /**
   * `paymentId` here is the fee-ASSIGNMENT id from `getPaymentSummary`; the
   * endpoint finds or creates the matching student_fee_payments row and
   * returns *its* id, which is what `getPaymentStatus` then polls.
   */
  async initiatePayment(data: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const response = await client.post<ApiResponse<InitiatePaymentResult>>(
      `/api/payment/students/${data.paymentId}/initiate`,
      { amount: data.amount },
    );
    return response.data.data;
  },

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    interface RawPaymentStatus {
      paymentId: string | number;
      gatewayStatus: string | null;
      studentPaymentStatus: string;
    }
    const response = await client.get<ApiResponse<RawPaymentStatus>>(
      `/api/payment/students/${paymentId}/status`,
    );
    const raw = response.data.data;

    // The endpoint reports the stored status and the gateway's separately; the
    // app only wants to know whether to stop polling.
    return {
      status: raw?.studentPaymentStatus ?? 'pending',
      gatewayStatus: raw?.gatewayStatus ?? null,
      isCompleted:
        raw?.studentPaymentStatus === 'paid' ||
        String(raw?.gatewayStatus ?? '').toUpperCase() === 'COMPLETED',
    };
  },
};
