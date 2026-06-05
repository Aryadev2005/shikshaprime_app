import { paymentClient, feesClient } from './clients';
import logger from '../utils/logger';
import { ApiError } from '../utils/api-error';
import {
  UpstreamPaymentListResponse,
  UpstreamInitiateResponse,
  UpstreamPaymentStatusResponse,
  UpstreamFeesDuesResponse,
  UpstreamReceiptsResponse,
  UpstreamLedgerResponse,
  MobilePaymentSummary,
  MobileReceipt,
  MobileInitiateResult,
  MobilePaymentStatus,
  MobileLedger,
} from '../types/payment.types';
import {
  toMobilePaymentSummary,
  toMobileReceiptList,
  toMobileLedger,
} from '../models/dto/payment.dto';

export class PaymentService {
  async getSummary(
    studentId: string,
    token: string,
    tenant: string,
  ): Promise<MobilePaymentSummary> {
    // Fan-out — fees service may be unavailable, so use allSettled
    const [pendingResult, duesResult] = await Promise.allSettled([
      paymentClient.request(token, tenant, {
        method: 'GET',
        url: '/students',
        params: { status: 'PENDING' },
      }),
      feesClient.request(token, tenant, {
        method: 'GET',
        url: `/dues/${studentId}`,
      }),
    ]);

    // Payments are required; fees is optional (fallback)
    if (pendingResult.status === 'rejected') {
      logger.error(
        { error: pendingResult.reason },
        '[PaymentService] getSummary: payment service error',
      );
      throw new ApiError(502, 'Failed to fetch payment data');
    }

    const paymentsUpstream = pendingResult.value.data as UpstreamPaymentListResponse;
    if (paymentsUpstream.status !== 1) {
      throw new ApiError(502, 'Failed to fetch payment data');
    }

    let dues = null;
    if (duesResult.status === 'fulfilled') {
      const duesUpstream = duesResult.value.data as UpstreamFeesDuesResponse;
      if (duesUpstream.status === 1) {
        dues = duesUpstream.data.dues;
      }
    } else {
      logger.warn(
        { error: duesResult.reason, studentId },
        '[PaymentService] getSummary: fees service unavailable — using payment data only',
      );
    }

    return toMobilePaymentSummary(paymentsUpstream.data, dues);
  }

  async getHistory(
    studentId: string,
    token: string,
    tenant: string,
  ): Promise<MobileReceipt[]> {
    try {
      const response = await feesClient.request(token, tenant, {
        method: 'GET',
        url: `/receipts/student/${studentId}`,
      });

      const upstream = response.data as UpstreamReceiptsResponse;
      if (upstream.status !== 1) {
        throw new ApiError(502, 'Failed to fetch payment history');
      }

      return toMobileReceiptList(upstream.data);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error({ error, studentId }, '[PaymentService] getHistory error');
      throw new ApiError(502, 'Failed to fetch payment history');
    }
  }

  async initiatePayment(
    paymentId: string,
    amount: number | undefined,
    token: string,
    tenant: string,
  ): Promise<MobileInitiateResult> {
    try {
      const body: { amount?: number } = {};
      if (amount !== undefined) body.amount = amount;

      const response = await paymentClient.request(token, tenant, {
        method: 'POST',
        url: `/students/${paymentId}/initiate`,
        data: body,
      });

      const upstream = response.data as UpstreamInitiateResponse;
      if (upstream.status !== 1) {
        throw new ApiError(502, 'Failed to initiate payment');
      }

      return {
        paymentId: upstream.data.paymentId,
        merchantOrderId: upstream.data.merchantOrderId,
        amount: upstream.data.amount,
        redirectUrl: upstream.data.redirectUrl,
        expiresAt: upstream.data.expiresAt,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error({ error, paymentId }, '[PaymentService] initiatePayment error');
      throw new ApiError(502, 'Failed to initiate payment');
    }
  }

  async getPaymentStatus(
    paymentId: string,
    token: string,
    tenant: string,
  ): Promise<MobilePaymentStatus> {
    try {
      const response = await paymentClient.request(token, tenant, {
        method: 'GET',
        url: `/students/${paymentId}/status`,
      });

      const upstream = response.data as UpstreamPaymentStatusResponse;
      if (upstream.status !== 1) {
        throw new ApiError(502, 'Failed to fetch payment status');
      }

      return {
        status: upstream.data.status,
        gatewayStatus: upstream.data.gateway_status ?? null,
        isCompleted: upstream.data.is_completed,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error({ error, paymentId }, '[PaymentService] getPaymentStatus error');
      throw new ApiError(502, 'Failed to fetch payment status');
    }
  }

  async getLedger(
    studentId: string,
    token: string,
    tenant: string,
  ): Promise<MobileLedger> {
    try {
      const response = await feesClient.request(token, tenant, {
        method: 'GET',
        url: '/reports/student-ledger',
        params: { student_id: studentId },
      });

      const upstream = response.data as UpstreamLedgerResponse;
      if (upstream.status !== 1) {
        throw new ApiError(502, 'Failed to fetch ledger');
      }

      return toMobileLedger(
        upstream.data.entries,
        upstream.data.openingBalance ?? 0,
        upstream.data.closingBalance ?? 0,
      );
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error({ error, studentId }, '[PaymentService] getLedger error');
      throw new ApiError(502, 'Failed to fetch ledger');
    }
  }
}

export const paymentService = new PaymentService();
