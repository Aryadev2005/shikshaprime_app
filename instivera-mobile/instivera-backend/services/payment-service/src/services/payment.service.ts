import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getTenantModels } from '../models';
import config from '../config';
import type { UpstreamPayment } from '../types/payment.types';

// ── PhonePe helpers ──────────────────────────────────────────────────────────

function phonePeAvailable(): boolean {
  return Boolean(config.phonepe.merchantId && config.phonepe.saltKey);
}

/**
 * Build the X-VERIFY header value: SHA256(base64Payload + apiEndpoint + saltKey) + "###" + saltIndex
 */
function buildPhonePeChecksum(base64Payload: string, endpoint: string): string {
  const raw = base64Payload + endpoint + config.phonepe.saltKey;
  return createHash('sha256').update(raw).digest('hex') + '###' + config.phonepe.saltIndex;
}

/**
 * Verify a PhonePe webhook X-VERIFY header.
 * Returns true if the signature matches.
 */
export function verifyPhonePeWebhook(xVerify: string, base64Response: string): boolean {
  if (!config.phonepe.saltKey) return false;
  const [receivedHash] = xVerify.split('###');
  const computed = createHash('sha256')
    .update(base64Response + config.phonepe.saltKey)
    .digest('hex');
  return computed === receivedHash;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class PaymentService {
  /** Format a DB payment row → UpstreamPayment shape */
  private format(p: any): UpstreamPayment {
    return {
      id: p.payment_id || String(p.id),
      amount: parseFloat(p.amount) || 0,
      paid_amount: p.paid_amount ? parseFloat(p.paid_amount) : undefined,
      status: (p.status || 'PENDING') as UpstreamPayment['status'],
      due_date: p.due_date ? String(p.due_date) : undefined,
      payment_mode: p.payment_mode || undefined,
      merchant_order_id: p.merchant_order_id || undefined,
      description: p.description || undefined,
      created_at: p.created_at ? new Date(p.created_at).toISOString() : undefined,
    };
  }

  async listPayments(studentId: string, tenant: string, statusFilter?: string): Promise<UpstreamPayment[]> {
    const { Payment } = getTenantModels(tenant);
    const where: any = { student_id: studentId };
    if (statusFilter) where.status = statusFilter;

    const rows: any[] = await (Payment as any).findAll({
      where,
      order: [['created_at', 'DESC']],
    });
    return rows.map((r: any) => this.format(r));
  }

  async getPaymentById(paymentId: string, tenant: string): Promise<UpstreamPayment> {
    const { Payment } = getTenantModels(tenant);
    const row: any = await (Payment as any).findOne({
      where: isNaN(Number(paymentId)) ? { payment_id: paymentId } : { id: Number(paymentId) },
    });
    if (!row) {
      const err: any = new Error('Payment not found');
      err.status = 404;
      throw err;
    }
    return this.format(row);
  }

  /**
   * Initiate a payment via PhonePe (or stub if credentials missing).
   * Returns UpstreamInitiateResponse.data shape.
   */
  async initiatePayment(
    paymentId: string,
    requestedAmount: number | undefined,
    studentId: string,
    tenant: string
  ): Promise<{ paymentId: string; merchantOrderId: string; amount: number; redirectUrl: string; expiresAt: string }> {
    const { Payment, PaymentTransaction } = getTenantModels(tenant);

    const payRow: any = await (Payment as any).findOne({
      where: isNaN(Number(paymentId)) ? { payment_id: paymentId } : { id: Number(paymentId) },
    });
    if (!payRow) {
      const err: any = new Error('Payment not found');
      err.status = 404;
      throw err;
    }

    const amount = requestedAmount ?? parseFloat(payRow.amount);
    const merchantOrderId = `ORD-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Store merchant_order_id for status checks
    await payRow.update({ merchant_order_id: merchantOrderId });

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min

    if (!phonePeAvailable()) {
      // Stub: return a local test redirect URL
      const redirectUrl = `http://localhost:${config.port}/payments/test-redirect?orderId=${merchantOrderId}&amount=${amount}`;
      return {
        paymentId: payRow.payment_id || String(payRow.id),
        merchantOrderId,
        amount,
        redirectUrl,
        expiresAt,
      };
    }

    // Real PhonePe integration
    const amountPaise = Math.round(amount * 100);
    const payload = {
      merchantId: config.phonepe.merchantId,
      merchantOrderId,
      merchantUserId: studentId,
      amount: amountPaise,
      redirectUrl: `http://localhost:${config.port}/payments/webhook`,
      redirectMode: 'POST',
      paymentInstrument: { type: 'PAY_PAGE' },
    };
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const endpoint = '/pg/v1/pay';
    const checksum = buildPhonePeChecksum(base64Payload, endpoint);

    try {
      // Dynamic import so service still boots if no internet / creds
      const axios = (await import('axios' as any)).default;
      const response = await axios.post(
        `${config.phonepe.baseUrl}${endpoint}`,
        { request: base64Payload },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
            'X-MERCHANT-ID': config.phonepe.merchantId,
          },
        }
      );
      const redirectUrl: string =
        response.data?.data?.instrumentResponse?.redirectInfo?.url ||
        `http://localhost:${config.port}/payments/test-redirect?orderId=${merchantOrderId}`;

      // Record the transaction attempt
      await (PaymentTransaction as any).create({
        transaction_id: uuidv4(),
        payment_id: payRow.id,
        gateway_status: 'INITIATED',
        amount,
        is_completed: 0,
      });

      return {
        paymentId: payRow.payment_id || String(payRow.id),
        merchantOrderId,
        amount,
        redirectUrl,
        expiresAt,
      };
    } catch (err: any) {
      throw new Error(`PhonePe initiation failed: ${err.message}`);
    }
  }

  async getPaymentStatus(
    paymentId: string,
    tenant: string
  ): Promise<{ status: string; gateway_status?: string; is_completed: boolean }> {
    const { Payment, PaymentTransaction } = getTenantModels(tenant);

    const payRow: any = await (Payment as any).findOne({
      where: isNaN(Number(paymentId)) ? { payment_id: paymentId } : { id: Number(paymentId) },
    });
    if (!payRow) {
      const err: any = new Error('Payment not found');
      err.status = 404;
      throw err;
    }

    // Get the latest transaction for gateway status
    const latestTx: any = await (PaymentTransaction as any).findOne({
      where: { payment_id: payRow.id },
      order: [['created_at', 'DESC']],
    });

    return {
      status: payRow.status || 'PENDING',
      gateway_status: latestTx?.gateway_status || undefined,
      is_completed: Boolean(latestTx?.is_completed),
    };
  }

  /**
   * Handle PhonePe webhook POST.
   * Updates payment status and creates/updates transaction record.
   */
  async handleWebhook(body: any, tenant: string): Promise<void> {
    const { Payment, PaymentTransaction } = getTenantModels(tenant);

    // Decode base64 response if present
    let decoded: any = body;
    if (typeof body.response === 'string') {
      try {
        decoded = JSON.parse(Buffer.from(body.response, 'base64').toString('utf8'));
      } catch {
        // fall through — use raw body
      }
    }

    const merchantOrderId: string =
      decoded?.data?.merchantOrderId ||
      decoded?.merchantOrderId ||
      body?.merchantOrderId;

    if (!merchantOrderId) return;

    const gatewayCode: string = decoded?.code || decoded?.data?.state || 'UNKNOWN';
    const isSuccess = gatewayCode === 'PAYMENT_SUCCESS' || gatewayCode === 'COMPLETED';

    const payRow: any = await (Payment as any).findOne({
      where: { merchant_order_id: merchantOrderId },
    });
    if (!payRow) return;

    // Update payment status
    const newStatus = isSuccess ? 'PAID' : payRow.status;
    await payRow.update({ status: newStatus });

    // Upsert transaction record
    const txRef: string = decoded?.data?.transactionId || decoded?.transactionId || uuidv4();
    const existing: any = await (PaymentTransaction as any).findOne({
      where: { payment_id: payRow.id },
      order: [['created_at', 'DESC']],
    });
    if (existing) {
      await existing.update({
        gateway_status: gatewayCode,
        gateway_reference: txRef,
        is_completed: isSuccess ? 1 : 0,
      });
    } else {
      await (PaymentTransaction as any).create({
        transaction_id: uuidv4(),
        payment_id: payRow.id,
        gateway_status: gatewayCode,
        gateway_reference: txRef,
        amount: parseFloat(payRow.amount),
        is_completed: isSuccess ? 1 : 0,
      });
    }
  }
}

export default new PaymentService();
