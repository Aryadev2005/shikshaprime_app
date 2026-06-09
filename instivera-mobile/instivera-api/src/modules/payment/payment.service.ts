import crypto from 'crypto';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { getTenantModels } from '../../models';
import { AppError } from '../../utils/appError';
import config from '../../config';

function phonePeAvailable() {
  return !!(config.phonepe.merchantId && config.phonepe.saltKey && config.phonepe.baseUrl);
}

function buildChecksum(payload: string, saltKey: string, saltIndex: number) {
  const base64 = Buffer.from(payload).toString('base64');
  const hash = crypto.createHash('sha256').update(`${base64}/pg/v1/pay${saltKey}`).digest('hex');
  return `${hash}###${saltIndex}`;
}

function verifyWebhookChecksum(encodedResponse: string, checksum: string, saltKey: string, saltIndex: number) {
  const hash = crypto.createHash('sha256').update(`${encodedResponse}${saltKey}`).digest('hex');
  const expected = `${hash}###${saltIndex}`;
  return expected === checksum;
}

export class PaymentService {
  static async listPayments(studentId: string, tenant: string) {
    const { Payment } = getTenantModels(tenant);
    return Payment.findAll({ where: { student_id: studentId }, order: [['created_at', 'DESC']] });
  }

  static async getPaymentDetail(paymentId: number, tenant: string) {
    const { Payment, PaymentTransaction } = getTenantModels(tenant) as any;
    const payment = await Payment.findByPk(paymentId, {
      include: [{ model: PaymentTransaction, as: 'transactions' }],
    });
    if (!payment) throw AppError.notFound('Payment not found');
    return payment;
  }

  static async initiatePayment(studentId: string, amount: number, description: string, callbackUrl: string, tenant: string) {
    const { Payment, PaymentTransaction } = getTenantModels(tenant);

    const payment = await Payment.create({
      student_id: studentId,
      amount,
      status: 'PENDING',
      description,
    } as any);

    if (!phonePeAvailable()) {
      return { payment, redirectUrl: null, message: 'PhonePe not configured; use test mode' };
    }

    const merchantOrderId = `ORDER-${uuidv4()}`;
    const payload = {
      merchantId: config.phonepe.merchantId,
      merchantOrderId,
      amount: Math.round(amount * 100),
      redirectUrl: callbackUrl,
      redirectMode: 'POST',
      paymentInstrument: { type: 'PAY_PAGE' },
    };

    const base64 = Buffer.from(JSON.stringify(payload)).toString('base64');
    const checksum = buildChecksum(JSON.stringify(payload), config.phonepe.saltKey, config.phonepe.saltIndex);

    const response = await axios.post(
      `${config.phonepe.baseUrl}/pg/v1/pay`,
      { request: base64 },
      { headers: { 'Content-Type': 'application/json', 'X-VERIFY': checksum, accept: 'application/json' } },
    );

    await payment.update({ merchant_order_id: merchantOrderId });
    await PaymentTransaction.create({ payment_id: payment.id, transaction_id: merchantOrderId, gateway_status: 'INITIATED', amount } as any);

    return { payment, redirectUrl: response.data?.data?.instrumentResponse?.redirectInfo?.url };
  }

  static async getPaymentStatus(merchantOrderId: string, tenant: string) {
    const { Payment } = getTenantModels(tenant);
    const payment = await Payment.findOne({ where: { merchant_order_id: merchantOrderId } });
    if (!payment) throw AppError.notFound('Payment not found');

    if (!phonePeAvailable()) return { payment };

    const saltKey = config.phonepe.saltKey;
    const saltIndex = config.phonepe.saltIndex;
    const path = `/pg/v1/status/${config.phonepe.merchantId}/${merchantOrderId}`;
    const hash = crypto.createHash('sha256').update(`${path}${saltKey}`).digest('hex');
    const checksum = `${hash}###${saltIndex}`;

    const response = await axios.get(`${config.phonepe.baseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json', 'X-VERIFY': checksum, 'X-MERCHANT-ID': config.phonepe.merchantId },
    });

    const status = response.data?.data?.state === 'COMPLETED' ? 'PAID' : 'PENDING';
    await payment.update({ status });

    return { payment, gatewayStatus: response.data?.data?.state };
  }

  static async handleWebhook(encodedResponse: string, checksum: string, tenant: string) {
    if (!phonePeAvailable()) throw AppError.badRequest('PhonePe not configured');

    const valid = verifyWebhookChecksum(encodedResponse, checksum, config.phonepe.saltKey, config.phonepe.saltIndex);
    if (!valid) throw AppError.badRequest('Invalid webhook signature');

    const decoded = JSON.parse(Buffer.from(encodedResponse, 'base64').toString('utf-8'));
    const merchantOrderId = decoded?.data?.merchantOrderId;
    const state = decoded?.data?.state;

    if (merchantOrderId && state) {
      const { Payment } = getTenantModels(tenant);
      const payment = await Payment.findOne({ where: { merchant_order_id: merchantOrderId } });
      if (payment) {
        await payment.update({ status: state === 'COMPLETED' ? 'PAID' : 'PENDING' });
      }
    }
    return { received: true };
  }
}
