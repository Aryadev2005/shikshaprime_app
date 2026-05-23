/**
 * PhonePe Payment Integration Utilities
 * Use these functions for PhonePe payment integration
 */

import { buildApiUrl } from "./tenantUrlBuilder";

export interface PhonePePaymentRequest {
  student_payment_id: number;
  redirect_url?: string;
  callback_url?: string;
  created_by?: number;
}

export interface PhonePePaymentResponse {
  status: number;
  message: string;
  data: {
    paymentUrl: string;
    merchantTransactionId: string;
    transactionId: number;
    amount: number;
    redirectMethod: string;
  };
}

export interface PhonePeStatusResponse {
  status: number;
  message: string;
  data: {
    merchantTransactionId: string;
    transactionId: string;
    amount: number;
    state: 'COMPLETED' | 'FAILED' | 'PENDING';
    expireAt?: number;
    responseCode: string;
    paymentInstrument: any;
    localTransaction: any;
  };
}

export class PhonePeIntegration {
  
  /**
   * Log payment flow for debugging
   */
  static logPaymentFlow(step: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🔧 PhonePe Debug - ${step}:`, data);
  }

  /**
   * Initiate PhonePe payment
   */
  static async initiatePayment(paymentRequest: PhonePePaymentRequest, tenant: string): Promise<PhonePePaymentResponse> {
    try {
      this.logPaymentFlow('Payment Initiation Started', paymentRequest);
      const baseUrl = buildApiUrl(tenant, Number(process.env.NEXT_PUBLIC_BASE_PORT), '/api/payments/phonepe/initiate');
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentRequest),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Payment initiation failed');
      }

      this.logPaymentFlow('Payment Initiation Success', result);
      return result;
    } catch (error) {
      this.logPaymentFlow('Payment Initiation Failed', error);
      throw error;
    }
  }

  /**
   * Check payment status
   */
  static async checkPaymentStatus(merchantTransactionId: string, tenant: string): Promise<PhonePeStatusResponse> {
    try {
      this.logPaymentFlow('Status Check Started', { merchantTransactionId });
      const baseUrl = buildApiUrl(tenant, Number(process.env.NEXT_PUBLIC_BASE_PORT), `/api/payments/phonepe/status/${merchantTransactionId}`);
      const response = await fetch(baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Status check failed');
      }

      this.logPaymentFlow('Status Check Success', result);
      return result;
    } catch (error) {
      this.logPaymentFlow('Status Check Failed', error);
      throw error;
    }
  }

  /**
   * Process payment with redirect to PhonePe
   */
  static async processPayment(
    studentPaymentId: number,
    amount: number,
    tenant: string,
    onSuccess?: (result: any) => void,
    onError?: (error: any) => void
  ): Promise<void> {
    try {
      this.logPaymentFlow('Processing Payment', { studentPaymentId, amount });
      const baseUrl = buildApiUrl(tenant, Number(process.env.NEXT_PUBLIC_BASE_PORT), '/api');
      // Generate redirect and callback URLs
      const currentUrl = window.location.origin;
      const redirectUrl = `${currentUrl}/payment/callback`;
      const callbackUrl = `${baseUrl}/payments/phonepe/webhook`;

      // Initiate payment
      const paymentResponse = await this.initiatePayment({
        student_payment_id: studentPaymentId,
        redirect_url: redirectUrl,
        callback_url: callbackUrl,
      }, tenant);

      // Store transaction details in session storage for callback handling
      sessionStorage.setItem('phonepe_transaction', JSON.stringify({
        merchantTransactionId: paymentResponse.data.merchantTransactionId,
        studentPaymentId: studentPaymentId,
        amount: amount,
        timestamp: Date.now()
      }));

      this.logPaymentFlow('Redirecting to PhonePe', {
        paymentUrl: paymentResponse.data.paymentUrl,
        merchantTransactionId: paymentResponse.data.merchantTransactionId
      });

      // Redirect to PhonePe payment page
      window.location.href = paymentResponse.data.paymentUrl;

    } catch (error: any) {
      this.logPaymentFlow('Payment Processing Failed', error);
      if (onError) {
        onError(error);
      } else {
        throw error;
      }
    }
  }

  /**
   * Handle payment callback result
   */
  static async handlePaymentCallback(tenant: string): Promise<{ success: boolean; pending?: boolean; state?: string; data?: any; error?: string }> {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const status = urlParams.get('status');
      const txnId = urlParams.get('txnId');

      this.logPaymentFlow('Payment Callback Received', { status, txnId });

      if (!txnId) {
        return { success: false, error: 'No transaction ID found' };
      }

      // Get transaction details from session storage
      const storedTransaction = sessionStorage.getItem('phonepe_transaction');
      if (storedTransaction) {
        const transactionData = JSON.parse(storedTransaction);
        
        // Verify the transaction ID matches
        if (transactionData.merchantTransactionId === txnId) {
          // Check final payment status
          const statusResponse = await this.checkPaymentStatus(txnId, tenant);
          
          // Clean up session storage
          return {
            success: statusResponse.data.state === 'COMPLETED',
            pending: statusResponse.data.state === 'PENDING',
            state: statusResponse.data.state,
            data: statusResponse.data
          };
        }
      }

      // Fallback: check status directly
      const statusResponse = await this.checkPaymentStatus(txnId, tenant);
      return {
        success: statusResponse.data.state === 'COMPLETED',
        pending: statusResponse.data.state === 'PENDING',
        state: statusResponse.data.state,
        data: statusResponse.data
      };

    } catch (error: any) {
      this.logPaymentFlow('Callback Handling Failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get payment transactions for a student payment
   */
  static async getPaymentTransactions(studentPaymentId: number, tenant: string): Promise<any> {
    try {
      const baseUrl = buildApiUrl(tenant, Number(process.env.NEXT_PUBLIC_BASE_PORT), `/api/payments/phonepe/transactions/${studentPaymentId}`);
      const response = await fetch(baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch transactions');
      }

      return result;
    } catch (error) {
      this.logPaymentFlow('Get Transactions Failed', error);
      throw error;
    }
  }

  /**
   * Generate payment link for external sharing
   */
  static generatePaymentLink(studentPaymentId: number): string {
    const currentUrl = window.location.origin;
    return `${currentUrl}/student-payment?paymentId=${studentPaymentId}`;
  }
}
