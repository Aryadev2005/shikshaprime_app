import { apiClient } from '../client';
import { ApiResponse } from '../../types/api';
import {
  PaymentSummary,
  PaymentReceipt,
  InitiatePaymentResult,
  PaymentStatus,
  InitiatePaymentInput,
} from '../../types/payment';

const client = apiClient.getClient();

export const paymentApi = {
  async getPaymentSummary(): Promise<PaymentSummary> {
    const response = await client.get<ApiResponse<PaymentSummary>>('/payment/summary');
    return response.data.data;
  },

  async getPaymentHistory(): Promise<PaymentReceipt[]> {
    const response = await client.get<ApiResponse<PaymentReceipt[]>>('/payment/history');
    return response.data.data;
  },

  async initiatePayment(data: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const response = await client.post<ApiResponse<InitiatePaymentResult>>(
      '/payment/initiate',
      data,
    );
    return response.data.data;
  },

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const response = await client.get<ApiResponse<PaymentStatus>>(
      `/payment/status/${paymentId}`,
    );
    return response.data.data;
  },
};
