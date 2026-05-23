import axios, { AxiosResponse } from "axios";
import { config } from "../config";
import { TSPHeadersUtil } from "../utils/tspHeaders";
import { buildFrontendUrl } from "../utils/tenantUrlBuilder";

/**
 * PhonePe Payment Request Structure
 */
export interface PhonePePaymentRequestV2 {
  merchantOrderId: string;
  amount: number;
  expireAt?: number;
  metaInfo?: Record<string, string>;
  paymentFlow: {
    type: "PG_CHECKOUT";
    message?: string;
    merchantUrls: {
      redirectUrl: string;
    };
  };
}

/**
 * PhonePe Payment Response
 */
export interface PhonePePaymentResponseV2 {
  orderId?: string;
  merchantOrderId?: string;
  state?: string;
  redirectUrl?: string;
  paymentUrl?: string;
  expireAt?: number;
  data?: any;
  [key: string]: any;
}

/**
 * PhonePe Status Response
 */
export interface PhonePeStatusResponse {
  success: boolean;
  message: string;
  data: {
    orderId?: string;
    merchantOrderId?: string;
    transactionId?: string;
    amount?: number;
    state?: "COMPLETED" | "FAILED" | "PENDING" | string;
    [key: string]: any;
  };
}

export interface PhonePeCreateWebhookRequest {
  url: string;
  description: string;
  username: string;
  password: string;
  events: string[];
}

export interface PhonePeCreateWebhookResponse {
  id: string;
  url: string;
  description: string;
  username: string;
  password: string;
  events: string[];
  createdAt: number;
  updatedAt: number;
  enabled: boolean;
  [key: string]: any;
}

export class PhonePeService {

  private baseUrl: string;
  private apiPrefix: string;

  constructor() {
    this.baseUrl = config.phonepe.baseUrl.replace(/\/+$/, "");
    this.apiPrefix = (config.phonepe.apiPrefix || "/apis/pg-sandbox").replace(/\/+$/, "");
  }

  private isIpAddress(hostname: string): boolean {
    return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  }

  private resolveRedirectUrl(tenant: string, redirectUrl?: string): string {
    const frontendUrl = buildFrontendUrl(tenant, "/online-registration");
    const candidate = (redirectUrl || frontendUrl || "").trim();

    if (!candidate) {
      throw new Error("PhonePe redirect URL is required");
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(candidate);
    } catch {
      throw new Error("PhonePe redirect URL must be a valid HTTPS URL");
    }

    const isProduction = process.env.NODE_ENV === "production" || config.env === "production";

    if (parsedUrl.protocol !== "https:" && isProduction) {
      throw new Error("PhonePe redirect URL must use HTTPS and cannot use localhost");
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    if ((hostname === "localhost" || hostname.endsWith(".localhost")) && isProduction) {
      throw new Error("PhonePe redirect URL cannot use localhost");
    }

    if (this.isIpAddress(hostname)) {
      throw new Error("PhonePe redirect URL cannot use an IP address");
    }

    return parsedUrl.toString();
  }

  private validateWebhookRequest(payload: PhonePeCreateWebhookRequest): void {
    const { url, username, password, events } = payload;

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error("PhonePe webhook URL must be a valid HTTPS URL");
    }

    if (parsedUrl.protocol !== "https:") {
      throw new Error("PhonePe webhook URL must use HTTPS");
    }

    if (!/^[A-Za-z0-9_]{5,20}$/.test(username)) {
      throw new Error("PhonePe webhook username must be 5-20 characters and contain only letters, digits, or underscores");
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]{8,20}$/.test(password)) {
      throw new Error("PhonePe webhook password must be 8-20 characters, alphanumeric, and contain both letters and numbers");
    }

    if (!Array.isArray(events) || events.length === 0) {
      throw new Error("At least one PhonePe webhook event is required");
    }
  }

  /**
   * Extract redirect/payment URL from PhonePe response
   */
  private extractPaymentUrl(payload: any): string | null {
    return (
      payload?.redirectUrl ||
      payload?.paymentUrl ||
      payload?.data?.redirectUrl ||
      payload?.data?.paymentUrl ||
      payload?.data?.instrumentResponse?.redirectInfo?.url ||
      (typeof payload === 'string' && payload.startsWith('http') ? payload : null)
    );
  }

  /**
   * Initiate PhonePe payment
   */
  async initiatePayment(
    tenant: string,
    amount: number,
    userId: number,
    merchantOrderId: string,
    redirectUrl?: string
  ): Promise<PhonePePaymentResponseV2> {

    try {

      const headers = await TSPHeadersUtil.generateStandardHeaders();
      const resolvedRedirectUrl = this.resolveRedirectUrl(tenant, redirectUrl);

      // 20 minute expiry required by PhonePe
      const expireAt = Date.now() + 20 * 60 * 1000;

      const paymentRequest: PhonePePaymentRequestV2 = {
        merchantOrderId,
        amount: Math.round(Number(amount) * 100),
        expireAt,
        paymentFlow: {
          type: "PG_CHECKOUT",
          message: "Student payment checkout",
          merchantUrls: {
            redirectUrl: resolvedRedirectUrl,
          },
        },
        metaInfo: {
          udf1: String(userId),
          udf2: merchantOrderId,
        },
      };

      const apiUrl = `${this.baseUrl}${this.apiPrefix}/checkout/v2/pay`;

      console.log(`[PhonePe v2] Request to ${apiUrl}`, JSON.stringify(paymentRequest, null, 2));

      const response: AxiosResponse<any> = await axios.post(
        apiUrl,
        paymentRequest,
        { headers }
      );

      console.log(`[PhonePe v2] Response:`, JSON.stringify(response.data, null, 2));

      return response.data;

    } catch (error: any) {

      console.error(
        "PhonePe v2 Payment Initiation Error:",
        error.response?.data || error.message
      );

      // Log full error for diagnostics
      console.error("[PhonePe Debug Error]", error);

      throw new Error(
        error.response?.data?.message ||
        error.message ||
        "PhonePe v2 payment initiation failed"
      );
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(
    merchantOrderId: string
  ): Promise<PhonePeStatusResponse> {

    try {

      const headers = await TSPHeadersUtil.generateStandardHeaders();

      const apiUrl =
        `${this.baseUrl}${this.apiPrefix}/checkout/v2/order/${merchantOrderId}/status?details=true`;

      const response: AxiosResponse<any> = await axios.get(
        apiUrl,
        { headers }
      );

      const payload = response.data || {};
      const statusData = payload.data || payload;

      return {
        success: true,
        message: payload.message || "OK",
        data: {
          orderId:
            statusData.orderId ||
            statusData.merchantOrderId ||
            merchantOrderId,

          merchantOrderId:
            statusData.merchantOrderId ||
            merchantOrderId,

          transactionId:
            statusData.transactionId ||
            statusData.paymentTransactionId,

          amount: statusData.amount,

          // PhonePe recommends using root-level state
          state: payload.state || statusData.state,

          ...statusData,
        },
      };

    } catch (error: any) {

      console.error(
        "PhonePe v2 Status Check Error:",
        error.response?.data || error.message
      );

      throw new Error(
        error.response?.data?.message ||
        "Failed to check PhonePe v2 payment status"
      );
    }
  }

  /**
   * Decode webhook payload
   */
  async processWebhook(
    _signature: string,
    encodedPayload: string
  ): Promise<{ success: boolean; message: string; data?: any }> {

    try {

      const decoded = JSON.parse(
        Buffer.from(encodedPayload, "base64").toString("utf8")
      );

      return {
        success: true,
        message: "Webhook processed",
        data: decoded,
      };

    } catch (error: any) {

      return {
        success: false,
        message: error.message || "Webhook processing failed",
      };
    }
  }

  /**
   * Generate PhonePe payment link
   */
  async generatePaymentLink(
    tenant: string,
    amount: number,
    userId: number,
    merchantOrderId: string,
    redirectUrl?: string
  ): Promise<{ paymentUrl: string; merchantOrderId: string; expireAt?: number }> {

    const paymentResponse =
      await this.initiatePayment(
        tenant,
        amount,
        userId,
        merchantOrderId,
        redirectUrl
      );

    let paymentUrl = this.extractPaymentUrl(paymentResponse);

    // If extractPaymentUrl failed but we have a success status, try to find ANY URL in the data
    if (!paymentUrl && paymentResponse && (paymentResponse.success || paymentResponse.status === 'SUCCESS' || paymentResponse.code === 'SUCCESS')) {
       const searchUrls = (obj: any): string | null => {
         if (!obj || typeof obj !== 'object') return null;
         if (obj.redirectUrl) return obj.redirectUrl;
         if (obj.paymentUrl) return obj.paymentUrl;
         if (obj.url && typeof obj.url === 'string' && obj.url.startsWith('http')) return obj.url;
         for (const key in obj) {
           const found = searchUrls(obj[key]);
           if (found) return found;
         }
         return null;
       };
       paymentUrl = searchUrls(paymentResponse);
    }

    if (!paymentUrl) {
      throw new Error(
        "PhonePe v2 response does not contain a payment redirect URL. Response: " + JSON.stringify(paymentResponse)
      );
    }

    return {
      paymentUrl,
      merchantOrderId:
        paymentResponse.merchantOrderId ||
        merchantOrderId,
      expireAt:
        paymentResponse.expireAt ||
        paymentResponse.data?.expireAt,
    };
  }

  /**
   * Create PhonePe webhook configuration
   */
  async createWebhook(
    payload: PhonePeCreateWebhookRequest
  ): Promise<PhonePeCreateWebhookResponse> {

    try {

      this.validateWebhookRequest(payload);

      const headers = await TSPHeadersUtil.generateStandardHeaders();

      const apiUrl =
        `${this.baseUrl}${this.apiPrefix}/configs/v1/webhooks`;

      const response: AxiosResponse<PhonePeCreateWebhookResponse> = await axios.post(
        apiUrl,
        payload,
        { headers }
      );

      return response.data;

    } catch (error: any) {

      console.error(
        "PhonePe Create Webhook Error:",
        error.response?.data || error.message
      );

      throw new Error(
        error.response?.data?.message ||
        "Failed to create PhonePe webhook"
      );
    }
  }
}
