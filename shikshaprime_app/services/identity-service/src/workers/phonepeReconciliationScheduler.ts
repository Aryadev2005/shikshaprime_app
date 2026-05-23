import { PhonePeService } from "../services/phonePeService";
import { QueryTypes } from "sequelize";
import { getTenantSequelize } from "../server";

const phonePeService = new PhonePeService();
const DEFAULT_ORDER_EXPIRY_MS = 20 * 60 * 1000;
const FIRST_STATUS_CHECK_DELAY_MS = 20 * 1000;

type PendingState = "INITIATED" | "PENDING";

type PendingPayment = {
  id: number;
  registration_id: number;
  gateway_transaction_id: string;
  fee_type: string;
  amount: number;
  status: string;
  created_at: string;
};

type TrackedOrder = {
  createdAtMs: number;
  expireAtMs: number;
  lastPolledAt?: number;
  inFlight: boolean;
};

const trackedOrders = new Map<string, TrackedOrder>();

function parseDateMs(value?: string | number | Date | null): number | null {

  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;

}

function getPollingIntervalMs(elapsedMs: number): number {

  if (elapsedMs < FIRST_STATUS_CHECK_DELAY_MS) {
    return FIRST_STATUS_CHECK_DELAY_MS;
  }

  if (elapsedMs < 50_000) {
    return 3_000;
  }

  if (elapsedMs < 110_000) {
    return 6_000;
  }

  if (elapsedMs < 170_000) {
    return 10_000;
  }

  if (elapsedMs < 230_000) {
    return 30_000;
  }

  return 60_000;

}

function getOrCreateTrackedOrder(
  merchantOrderId: string,
  createdAt?: string | number | Date | null,
  expireAt?: string | number | Date | null
): TrackedOrder {

  const existing = trackedOrders.get(merchantOrderId);

  const createdAtMs =
    parseDateMs(createdAt) ??
    existing?.createdAtMs ??
    Date.now();

  const expireAtMs =
    parseDateMs(expireAt) ??
    existing?.expireAtMs ??
    (createdAtMs + DEFAULT_ORDER_EXPIRY_MS);

  const trackedOrder: TrackedOrder = {
    createdAtMs,
    expireAtMs,
    lastPolledAt: existing?.lastPolledAt,
    inFlight: existing?.inFlight ?? false,
  };

  trackedOrders.set(merchantOrderId, trackedOrder);
  return trackedOrder;

}

function shouldPollOrder(
  trackedOrder: TrackedOrder,
  nowMs: number
): boolean {

  const elapsedMs = nowMs - trackedOrder.createdAtMs;

  if (elapsedMs < FIRST_STATUS_CHECK_DELAY_MS) {
    return false;
  }

  if (!trackedOrder.lastPolledAt) {
    return true;
  }

  return (nowMs - trackedOrder.lastPolledAt) >= getPollingIntervalMs(elapsedMs);

}

async function markPaymentPending(paymentId: number, tenant: string) {
  const sequelize = getTenantSequelize(tenant);
  await sequelize.query(
    `UPDATE payments
     SET status = 'PENDING'
     WHERE id = :payment_id
     AND status = 'INITIATED'`,
    {
      replacements: {
        payment_id: paymentId
      },
      type: QueryTypes.UPDATE
    }
  );

}

async function processCompletedPayment(
  payment: PendingPayment,
  transactionId: string,
  tenant: string
) {

  const receiptNo = `RCPT-${payment.registration_id}-${Date.now()}`;

  const paidAt = new Date();

  const paidAtSql =
    `${paidAt.getFullYear()}-${String(paidAt.getMonth() + 1).padStart(2, "0")}-${String(paidAt.getDate()).padStart(2, "0")} ` +
    `${String(paidAt.getHours()).padStart(2, "0")}:${String(paidAt.getMinutes()).padStart(2, "0")}:${String(paidAt.getSeconds()).padStart(2, "0")}`;
  const sequelize = getTenantSequelize(tenant);
  await sequelize.query(
    `UPDATE payments
     SET status = 'SUCCESS',
         receipt_no = :receipt_no,
         paid_at = :paid_at,
         gateway_transaction_id = :txn
     WHERE id = :payment_id`,
    {
      replacements: {
        payment_id: payment.id,
        receipt_no: receiptNo,
        paid_at: paidAtSql,
        txn: transactionId || payment.gateway_transaction_id
      },
      type: QueryTypes.UPDATE
    }
  );

  let newStatus = "PAYMENT_COMPLETED";

  if (payment.fee_type === "REGISTRATION") {
    newStatus = "REGISTRATION_COMPLETED";
  }

  await sequelize.query(
    `UPDATE student_registrations
     SET status = :newStatus
     WHERE id = :registration_id`,
    {
      replacements: {
        registration_id: payment.registration_id,
        newStatus
      },
      type: QueryTypes.UPDATE
    }
  );

  console.log(
    "[PHONEPE_CRON] Payment SUCCESS processed",
    payment.gateway_transaction_id
  );

  unregisterPhonePeOrder(payment.gateway_transaction_id);
}

async function processFailedPayment(payment: PendingPayment, tenant: string) {
  const sequelize = getTenantSequelize(tenant);
  await sequelize.query(
    `UPDATE payments
     SET status = 'FAILED'
     WHERE id = :payment_id
     AND status NOT IN ('SUCCESS', 'FAILED')`,
    {
      replacements: {
        payment_id: payment.id
      },
      type: QueryTypes.UPDATE
    }
  );

  console.log(
    "[PHONEPE_CRON] Payment FAILED",
    payment.gateway_transaction_id
  );

  unregisterPhonePeOrder(payment.gateway_transaction_id);
}

function hasOrderExpired(trackedOrder: TrackedOrder, nowMs: number): boolean {
  return nowMs >= trackedOrder.expireAtMs;
}

async function checkOrder(
  payment: PendingPayment,
  trackedOrder: TrackedOrder,
  tenant: string
) {

  console.log("[PHONEPE_CRON] Polling order", payment.gateway_transaction_id, new Date().toISOString());


  try {
    trackedOrder.inFlight = true;

    const status = await phonePeService.checkPaymentStatus(
      payment.gateway_transaction_id
    );

    trackedOrder.lastPolledAt = Date.now();

    const state = String(status?.data?.state || "").toUpperCase();

    if (!state) {
      return;
    }

    if (state === "COMPLETED") {

      await processCompletedPayment(
        payment,
        status.data.transactionId,
        tenant
      );

      return;
    }

    if (state === "FAILED") {

      await processFailedPayment(payment, tenant);

      return;
    }

    if (state === "PENDING") {

      await markPaymentPending(payment.id, tenant);

      if (hasOrderExpired(trackedOrder, trackedOrder.lastPolledAt)) {
        await processFailedPayment(payment, tenant);
      }

      return;
    }

  } catch (err) {

    console.error(
      "[PHONEPE_CRON] Status check failed",
      payment.gateway_transaction_id,
      err
    );

  }

  finally {
    trackedOrder.inFlight = false;
  }

}

export function registerPendingPhonePeOrder({
  merchantOrderId,
  createdAt,
  expireAt
}: {
  merchantOrderId: string;
  createdAt?: string | number | Date | null;
  expireAt?: string | number | Date | null;
}) {

  getOrCreateTrackedOrder(
    merchantOrderId,
    createdAt,
    expireAt
  );

}

export function unregisterPhonePeOrder(merchantOrderId: string) {
  trackedOrders.delete(merchantOrderId);
}

export async function runPhonePeReconciliation(tenant: string) {

  try {
    const sequelize = getTenantSequelize(tenant);

    const pendingPayments = await sequelize.query<PendingPayment>(

      `SELECT id,
              registration_id,
              gateway_transaction_id,
              fee_type,
              amount,
              status,
              created_at
       FROM payments
       WHERE status IN ('INITIATED', 'PENDING')
       AND gateway_transaction_id IS NOT NULL
       AND created_at >= NOW() - INTERVAL 25 MINUTE`,

      { type: QueryTypes.SELECT }

    );

    if (!pendingPayments.length) {
      return;
    }

    const nowMs = Date.now();

    for (const payment of pendingPayments) {
      const trackedOrder = getOrCreateTrackedOrder(
        payment.gateway_transaction_id,
        payment.created_at
      );

      if (trackedOrder.inFlight || !shouldPollOrder(trackedOrder, nowMs)) {
        continue;
      }

      await checkOrder(payment, trackedOrder, tenant);

    }

  } catch (err) {

    console.error("[PHONEPE_CRON] Reconciliation error", err);

  }

}
