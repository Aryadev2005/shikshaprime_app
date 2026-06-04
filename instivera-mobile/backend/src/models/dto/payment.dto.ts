import {
  UpstreamPayment,
  UpstreamFeesDue,
  UpstreamReceipt,
  UpstreamLedgerEntry,
  MobilePaymentSummary,
  MobileOutstanding,
  MobileBreakdownItem,
  MobileRecentPayment,
  MobileReceipt,
  MobileLedger,
  MobileLedgerEntry,
} from '../../types/payment.types';

const today = (): Date => new Date();

// Build summary from dues data (full accuracy)
const summaryFromDues = (
  dues: UpstreamFeesDue[],
  pendingPayments: UpstreamPayment[],
): MobilePaymentSummary => {
  const unpaid = dues.filter((d) => d.status !== 'PAID');
  const paid = dues.filter((d) => d.status === 'PAID');

  const totalAmount = unpaid.reduce((s, d) => s + d.balance, 0);
  const annualTotal = dues.reduce((s, d) => s + d.amount, 0);
  const paidSoFar = dues.reduce((s, d) => s + d.paid_amount, 0);

  const now = today();
  const sortedDueDates = unpaid
    .map((d) => d.due_date)
    .filter(Boolean)
    .sort();
  const earliestDue = sortedDueDates[0] ?? null;
  const isOverdue = unpaid.some((d) => d.due_date && new Date(d.due_date) < now);

  const outstanding: MobileOutstanding = {
    totalAmount,
    currency: 'INR',
    dueDate: earliestDue,
    isOverdue,
  };

  const breakdown: MobileBreakdownItem[] = dues.map((d) => ({
    label: d.fee_head_name,
    amount: d.amount,
    paidAmount: d.paid_amount,
    balance: d.balance,
    status: d.status,
    dueDate: d.due_date,
  }));

  const recentPayments: MobileRecentPayment[] = paid.map((d) => ({
    label: d.fee_head_name,
    date: d.due_date,
    mode: 'ONLINE',
    amount: d.paid_amount,
  }));

  // Use first pending payment's id for the "Pay now" CTA
  const primaryPaymentId = pendingPayments.length > 0 ? pendingPayments[0].id : null;

  return {
    outstanding,
    annualTotal,
    paidSoFar,
    primaryPaymentId,
    breakdown,
    recentPayments,
  };
};

// Fallback: build from payment-service data only (fees service unavailable)
const summaryFromPaymentsOnly = (pendingPayments: UpstreamPayment[]): MobilePaymentSummary => {
  const totalAmount = pendingPayments.reduce(
    (s, p) => s + (p.amount - (p.paid_amount ?? 0)),
    0,
  );

  const now = today();
  const sortedDueDates = pendingPayments
    .map((p) => p.due_date ?? '')
    .filter(Boolean)
    .sort();
  const earliestDue = sortedDueDates[0] ?? null;
  const isOverdue = pendingPayments.some(
    (p) => p.due_date && new Date(p.due_date) < now,
  );

  const breakdown: MobileBreakdownItem[] = pendingPayments.map((p) => ({
    label: p.description ?? 'Fee',
    amount: p.amount,
    paidAmount: p.paid_amount ?? 0,
    balance: p.amount - (p.paid_amount ?? 0),
    status: p.status,
    dueDate: p.due_date ?? '',
  }));

  return {
    outstanding: { totalAmount, currency: 'INR', dueDate: earliestDue, isOverdue },
    annualTotal: totalAmount,
    paidSoFar: 0,
    primaryPaymentId: pendingPayments.length > 0 ? pendingPayments[0].id : null,
    breakdown,
    recentPayments: [],
  };
};

export const toMobilePaymentSummary = (
  pendingPayments: UpstreamPayment[],
  dues: UpstreamFeesDue[] | null,
): MobilePaymentSummary => {
  if (!dues) {
    return summaryFromPaymentsOnly(pendingPayments);
  }
  return summaryFromDues(dues, pendingPayments);
};

export const toMobileReceiptList = (receipts: UpstreamReceipt[]): MobileReceipt[] =>
  receipts.map((r) => ({
    id: r.id,
    receiptNumber: r.receipt_number ?? r.id,
    date: r.date,
    amount: r.amount,
    mode: r.payment_mode,
    description: r.description ?? '',
  }));

export const toMobileLedger = (
  entries: UpstreamLedgerEntry[],
  openingBalance: number,
  closingBalance: number,
): MobileLedger => ({
  entries: entries.map(
    (e): MobileLedgerEntry => ({
      date: e.date,
      description: e.description,
      debit: e.debit,
      credit: e.credit,
      balance: e.balance,
    }),
  ),
  openingBalance,
  closingBalance,
});
