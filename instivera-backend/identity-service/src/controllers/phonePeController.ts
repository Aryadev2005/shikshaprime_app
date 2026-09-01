import { Request, Response } from "express";
import crypto from "crypto";
import {
  PhonePeCreateWebhookRequest,
  PhonePeService,
} from "../services/phonePeService";
import { QueryTypes } from "sequelize";
import { config } from "../config";
import {
  registerPendingPhonePeOrder,
  unregisterPhonePeOrder,
} from "../workers/phonepeReconciliationScheduler";
import { getTenantSequelize } from "../server";
import { buildApiUrl, buildFrontendUrl } from "../utils/tenantUrlBuilder";

const phonePeService = new PhonePeService();

type PaymentRow = {
  id: number;
  registration_id: number;
  fee_type: string;
  amount: number;
  status: string;
  gateway_transaction_id: string | null;
};

type MerchantOrderParams = {
  merchantOrderId: string;
};

type CallbackQuery = {
  merchantOrderId?: string;
  merchantTransactionId?: string;
};

type CreateWebhookConfigurationBody = Partial<PhonePeCreateWebhookRequest>;

type PhonePeWebhookEvent =
  | "checkout.order.completed"
  | "checkout.order.failed"
  | "pg.refund.completed"
  | "pg.refund.failed"
  | "pg.refund.accepted"
  | "CHECKOUT_ORDER_COMPLETED"
  | "CHECKOUT_ORDER_FAILED"
  | "PG_REFUND_COMPLETED"
  | "PG_REFUND_FAILED"
  | "PG_REFUND_ACCEPTED";

/* =====================================================
Helpers
===================================================== */

function getString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Internal server error";
}

function logWebhook(stage: string, details: Record<string, unknown> = {}): void {
  console.log(`[PHONEPE_WEBHOOK] ${stage}`, {
    timestamp: new Date().toISOString(),
    ...details,
  });
}

function isWebhookUrlConfigured(tenant: string): boolean {
  return Boolean(buildApiUrl(tenant, "/api/identity/payments/phonepe/webhook"));
}

function isWebhookCredentialConfigured(): boolean {
  return Boolean(
    config.phonepe.webhook.username &&
    config.phonepe.webhook.password
  );
}

function isValidWebhookUsername(username: string): boolean {
  return /^[A-Za-z0-9_]{5,20}$/.test(username);
}

function isValidWebhookPassword(password: string): boolean {
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]{8,20}$/.test(password);
}

function isSupportedWebhookEvent(event: string): event is PhonePeWebhookEvent {
  return [
    "checkout.order.completed",
    "checkout.order.failed",
    "pg.refund.completed",
    "pg.refund.failed",
    "pg.refund.accepted",
    "CHECKOUT_ORDER_COMPLETED",
    "CHECKOUT_ORDER_FAILED",
    "PG_REFUND_COMPLETED",
    "PG_REFUND_FAILED",
    "PG_REFUND_ACCEPTED",
  ].includes(event);
}

function isWebhookUrlValidForPhonePe(url?: string): boolean {
  if (!url) {
    return false;
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    return false;
  }

  return parsedUrl.protocol === "https:";
}

/**
PhonePe webhook authorization validation
Authorization: <sha256(username:password)> or SHA256 <sha256(username:password)>
*/
function validateWebhookAuthorization(header?: string): boolean {

  if (!header) return false;

  const username = config.phonepe.webhook.username || "";
  const password = config.phonepe.webhook.password || "";

  if (!username || !password) {
    return false;
  }

  const normalized = header.trim();

  const expectedRaw = `${username}:${password}`;

  const expectedHash = crypto
    .createHash("sha256")
    .update(expectedRaw)
    .digest("hex");

  const receivedValue = normalized
    .replace(/^SHA256\s+/i, "")
    .trim()
    .toLowerCase();

  if (receivedValue === expectedRaw.toLowerCase()) {
    return true;
  }

  const expectedBuffer = Buffer.from(expectedHash, "utf8");
  const receivedBuffer = Buffer.from(receivedValue, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function maskWebhookCredential(value: string): string {

  if (!value) {
    return "";
  }

  if (value.length <= 4) {
    return "*".repeat(value.length);
  }

  return `${value.slice(0, 2)}${"*".repeat(value.length - 4)}${value.slice(-2)}`;

}

/* =====================================================
Payment Processing Logic
===================================================== */

async function processSuccessfulPayment(
  merchantOrderId: string,
  transactionId: string,
  tenant: string
) {
  const sequelize = getTenantSequelize(tenant);
  const [payment] = await sequelize.query<PaymentRow>(

    `SELECT id, registration_id, fee_type, amount, status, gateway_transaction_id
     FROM payments
     WHERE gateway_transaction_id = :orderId
     LIMIT 1`,

    {
      replacements: { orderId: merchantOrderId },
      type: QueryTypes.SELECT,
    }

  );

  if (!payment) return;

  if (payment.status === "SUCCESS") return;

  const receiptNo = `RCPT-${payment.registration_id}-${Date.now()}`;

  const paidAt = new Date();

  const paidAtSql =
    `${paidAt.getFullYear()}-${String(paidAt.getMonth() + 1).padStart(2, "0")}-${String(paidAt.getDate()).padStart(2, "0")} ` +
    `${String(paidAt.getHours()).padStart(2, "0")}:${String(paidAt.getMinutes()).padStart(2, "0")}:${String(paidAt.getSeconds()).padStart(2, "0")}`;

  await sequelize.query(

    `UPDATE payments
     SET status='SUCCESS',
         receipt_no=:receipt_no,
         paid_at=:paid_at,
         gateway_transaction_id=:txn
     WHERE id=:payment_id`,

    {
      replacements: {
        payment_id: payment.id,
        receipt_no: receiptNo,
        paid_at: paidAtSql,
        txn: transactionId || merchantOrderId
      },
      type: QueryTypes.UPDATE,
    }

  );

  let newStatus = "PAYMENT_COMPLETED";

  if (payment.fee_type === "REGISTRATION") {
    newStatus = "REGISTRATION_COMPLETED";
  }

  await sequelize.query(
    `UPDATE student_application_status sas
      INNER JOIN student_pre_registration spr
        ON sas.application_id = spr.application_id
    SET sas.status = :status
    WHERE spr.id = :registration_id`,
    {
      replacements: {
        registration_id: payment.registration_id,
        status: newStatus,
      },
      type: QueryTypes.UPDATE,
    }
  );
}

async function processFailedPayment(
  merchantOrderId: string,
  tenant: string
) {
  const sequelize = getTenantSequelize(tenant);
  await sequelize.query(
    `UPDATE payments
     SET status = 'FAILED'
     WHERE gateway_transaction_id = :orderId`,
    {
      replacements: { orderId: merchantOrderId },
      type: QueryTypes.UPDATE,
    }
  );

}

/**
 * Initiate PhonePe payment
 * POST /api/identity/payments/phonepe/initiate
 */
export const initiatePayment = async (req, res: Response) => {
  try {
    const { amount, userId, merchantOrderId, redirectUrl } = req.body;

    if (!amount || !userId || !merchantOrderId) {
      return res.status(400).json({
        status: 0,
        message: "Amount, userId, and merchantOrderId are required",
      });
    }

    // Record initial transaction in database
    // We need to link this to a registration if possible (often userId == registration.id for students)
    // For general student payments, we might need a separate schema, but following the system's pattern:
    try {
      const sequelize = getTenantSequelize(req.tenant);
      await sequelize.query(
        `INSERT INTO payments 
         (registration_id, merchant_id, fee_type, amount, currency, payment_mode, status, gateway_transaction_id)
         VALUES (:userId, :merchantId, 'STUDENT_PAYMENT', :amount, 'INR', 'ONLINE', 'INITIATED', :merchantOrderId)`,
        {
          replacements: {
            userId,
            merchantId: config.phonepe.merchantId || 'RETECHUAT',
            amount: amount / 100, // stored in rupees
            merchantOrderId
          },
          type: QueryTypes.INSERT
        }
      );
    } catch (dbError) {
      console.warn("[INITIATE_PAYMENT] DB recording failed (possibly missing registration_id link):", dbError);
      // Continue anyway, but status reconciliation might fail later
    }

    // Call PhonePe service to generate payment link
    const paymentData = await phonePeService.generatePaymentLink(
      req.tenant,
      amount / 100, // Convert back from paise to rupees for the service
      userId,
      merchantOrderId,
      redirectUrl
    );

    return res.status(200).json({
      status: 1,
      message: "Payment link generated successfully",
      data: paymentData,
    });
  } catch (error) {
    console.error("[INITIATE_PAYMENT_ERROR]", error);
    return res.status(500).json({
      status: 0,
      message: getErrorMessage(error),
    });
  }
};


export const getWebhookListenerStatus = async (
  req: Request,
  res: Response
) => {

  return res.status(200).json({
    success: true,
    message: "PhonePe webhook listener is active",
    data: {
      path: "/api/identity/payments/phonepe/webhook",
      acceptsAuthorizationFormat: "Authorization: <sha256(username:password)>",
    },
  });

};

export const handleWebhook = async (
  req,
  res: Response
) => {

  try {

    const authHeader = req.headers.authorization;
    const payload = req.body;
    const event = String(payload.event || "");
    const merchantOrderId =
      payload.payload?.merchantOrderId;
    const state = String(
      payload.payload?.state || ""
    ).toUpperCase();

    logWebhook("RECEIVED", {
      event,
      merchantOrderId,
      state,
      hasAuthorizationHeader: Boolean(authHeader),
      authorizationPreview: authHeader ? authHeader.slice(0, 16) : null,
      requestMethod: req.method,
      requestPath: req.originalUrl,
    });

    if (!validateWebhookAuthorization(authHeader)) {

      console.warn("[PHONEPE_WEBHOOK] AUTH_FAILED", {
        timestamp: new Date().toISOString(),
        event,
        merchantOrderId,
        receivedAuthorizationPrefix: authHeader?.slice(0, 12) || null,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid webhook authorization",
      });

    }

    logWebhook("AUTH_VALIDATED", {
      event,
      merchantOrderId,
      state,
    });

    const transactionId =
      payload.payload?.transactionId ||
      payload.payload?.paymentDetails?.[0]?.transactionId ||
      null;

    if (
      (event === "checkout.order.completed" || event === "CHECKOUT_ORDER_COMPLETED") &&
      merchantOrderId &&
      state === "COMPLETED"
    ) {

      await processSuccessfulPayment(
        merchantOrderId,
        transactionId,
        req.tenant
      );

      unregisterPhonePeOrder(merchantOrderId);

      logWebhook("ORDER_COMPLETED_PROCESSED", {
        merchantOrderId,
        transactionId,
      });

    }

    if (
      (event === "checkout.order.failed" || event === "CHECKOUT_ORDER_FAILED") &&
      merchantOrderId
    ) {

      await processFailedPayment(merchantOrderId, req.tenant);
      unregisterPhonePeOrder(merchantOrderId);

      logWebhook("ORDER_FAILED_PROCESSED", {
        merchantOrderId,
      });

    }

    if (
      event === "pg.refund.completed" ||
      event === "pg.refund.failed" ||
      event === "pg.refund.accepted" ||
      event === "PG_REFUND_COMPLETED" ||
      event === "PG_REFUND_FAILED" ||
      event === "PG_REFUND_ACCEPTED"
    ) {
      logWebhook("REFUND_EVENT_RECEIVED", {
        event,
        merchantOrderId: payload.payload?.originalMerchantOrderId || null,
        state,
      });
    }

    logWebhook("ACKNOWLEDGED", {
      event,
      merchantOrderId,
      state,
    });

    return res.status(200).json({
      success: true,
      message: "Webhook processed",
    });

  } catch (error) {

    console.error("[PHONEPE_WEBHOOK_ERROR]", {
      timestamp: new Date().toISOString(),
      error: getErrorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return res.status(200).json({
      success: false,
      message: getErrorMessage(error),
    });

  }

};

/* =====================================================
Webhook Configuration
===================================================== */

export const getWebhookConfigurationStatus = async (
  req,
  res: Response
) => {

  const webhookUrl = buildApiUrl(req.tenant, "/api/identity/payments/phonepe/webhook");
  const username = config.phonepe.webhook.username;
  const password = config.phonepe.webhook.password;

  const urlIsValidForPhonePe = isWebhookUrlValidForPhonePe(webhookUrl);

  console.log("[PHONEPE_WEBHOOK] Configuration status checked", {
    url: webhookUrl || null,
    url_is_valid_for_phonepe: urlIsValidForPhonePe,
    username: username ? maskWebhookCredential(username) : null,
    password_present: Boolean(password),
    events: config.phonepe.webhook.events,
  });

  return res.status(200).json({
    status: 1,
    message: "Webhook configuration status retrieved",
    data: {
      url: webhookUrl || null,
      configured: Boolean(
        isWebhookUrlConfigured(req.tenant) &&
        isWebhookCredentialConfigured() &&
        urlIsValidForPhonePe &&
        isValidWebhookUsername(username) &&
        isValidWebhookPassword(password)
      ),
      url_is_valid_for_phonepe: urlIsValidForPhonePe,
      has_username: Boolean(username),
      has_password: Boolean(password),
      username_valid: isValidWebhookUsername(username),
      password_valid: isValidWebhookPassword(password),
      events: config.phonepe.webhook.events,
      listener_path: "/api/identity/payments/phonepe/webhook"
    }
  });

};

export const createWebhookConfiguration = async (
  req,
  res: Response
) => {

  try {

    const webhookUrl = req.body.url || buildApiUrl(req.tenant, "/api/identity/payments/phonepe/webhook");
    const username = req.body.username || config.phonepe.webhook.username;
    const password = req.body.password || config.phonepe.webhook.password;
    const events =
      req.body.events?.length
        ? req.body.events
        : config.phonepe.webhook.events;
    const description =
      req.body.description || config.phonepe.webhook.description;

    if (!isWebhookUrlValidForPhonePe(webhookUrl)) {
      return res.status(400).json({
        status: 0,
        message: "PHONEPE_WEBHOOK_URL must be configured with a valid HTTPS URL and must not include a port number"
      });
    }

    if (!isValidWebhookUsername(username)) {
      return res.status(400).json({
        status: 0,
        message: "PHONEPE_WEBHOOK_USERNAME must be 5-20 characters and contain only letters, digits, or underscores"
      });
    }

    if (!isValidWebhookPassword(password)) {
      return res.status(400).json({
        status: 0,
        message: "PHONEPE_WEBHOOK_PASSWORD must be 8-20 characters and contain both letters and digits"
      });
    }

    const invalidEvents = events.filter((event) => !isSupportedWebhookEvent(event));

    if (invalidEvents.length) {
      return res.status(400).json({
        status: 0,
        message: `Unsupported PhonePe webhook events: ${invalidEvents.join(", ")}`
      });
    }

    console.log("[PHONEPE_WEBHOOK] Creating webhook configuration", {
      url: webhookUrl,
      description,
      username: maskWebhookCredential(username),
      events,
    });

    const webhookResponse = await phonePeService.createWebhook({
      url: webhookUrl,
      description,
      username,
      password,
      events
    }, req.tenant);

    const configuredCredentials = `${webhookResponse.username}:${webhookResponse.password}`;
    const authorizationHash = crypto
      .createHash("sha256")
      .update(configuredCredentials)
      .digest("hex");

    return res.status(200).json({
      status: 1,
      message: "PhonePe webhook configured successfully",
      data: {
        ...webhookResponse,
        callbackUrl: webhookResponse.url,
        validation: {
          authorizationHeaderFormat: "Authorization: <sha256(username:password)>",
          acceptedAuthorizationExamples: [
            authorizationHash,
            `SHA256 ${authorizationHash}`,
            `SHA256 ${configuredCredentials}`,
          ],
          events: webhookResponse.events,
        },
      }
    });

  } catch (error) {

    console.error("[PHONEPE_WEBHOOK] Create webhook configuration failed", error);

    return res.status(500).json({
      status: 0,
      message: getErrorMessage(error)
    });

  }

};

/* =====================================================
Order Status API
===================================================== */

export const getPaymentStatus = async (
  req,
  res: Response
) => {

  try {

    const { merchantOrderId } = req.params;

    if (!merchantOrderId) {

      return res.status(400).json({
        status: 0,
        message: "Merchant order ID required",
      });

    }

    const statusResponse =
      await phonePeService.checkPaymentStatus(
        merchantOrderId, req.tenant
      );

    const state =
      String(statusResponse.data.state || "")
      .toUpperCase();

    if (state === "COMPLETED") {

      await processSuccessfulPayment(
        merchantOrderId,
        statusResponse.data.transactionId,
        req.tenant
      );

      unregisterPhonePeOrder(merchantOrderId);

    } else if (state === "FAILED") {

      await processFailedPayment(merchantOrderId, req.tenant);
      unregisterPhonePeOrder(merchantOrderId);

    } else if (state === "PENDING") {

      registerPendingPhonePeOrder({
        merchantOrderId,
        expireAt: statusResponse.data.expireAt,
      });

    }

    return res.status(200).json({
      status: 1,
      message: "Status retrieved",
      data: statusResponse.data,
    });

  } catch (error) {

    return res.status(500).json({
      status: 0,
      message: getErrorMessage(error),
    });

  }

};

/* =====================================================
Frontend Callback
===================================================== */

export const paymentCallback = async (
  req,
  res: Response
) => {

  try {

    const merchantOrderId =
      getString(req.query.merchantOrderId);

    const merchantTxnId =
      getString(req.query.merchantTransactionId);

    const orderId = merchantOrderId || merchantTxnId;

    const frontendUrl = buildFrontendUrl(req.tenant, "/online-registration");

    if (!orderId) {

      return res.redirect(
        `${frontendUrl}?status=FAILED`
      );

    }

    const statusResponse =
      await phonePeService.checkPaymentStatus(
        orderId, req.tenant
      );

    const state =
      String(statusResponse.data.state || "")
      .toUpperCase();

    if (state === "COMPLETED") {

      await processSuccessfulPayment(
        orderId,
        statusResponse.data.transactionId,
        req.tenant
      );

      unregisterPhonePeOrder(orderId);

    } else if (state === "FAILED") {

      await processFailedPayment(orderId, req.tenant);
      unregisterPhonePeOrder(orderId);

    } else if (state === "PENDING") {

      registerPendingPhonePeOrder({
        merchantOrderId: orderId,
        expireAt: statusResponse.data.expireAt,
      });

    }

    return res.redirect(
      `${frontendUrl}?status=${state}&txnId=${orderId}`
    );

  } catch {

    const frontendUrl = buildFrontendUrl(req.tenant, "/online-registration");

    return res.redirect(
      `${frontendUrl}?status=ERROR`
    );

  }

};

/* =====================================================
Lookup Payment
===================================================== */

export const lookupByOrder = async (
  req,
  res: Response
) => {

  try {

    const { merchantOrderId } = req.params;
    const sequelize = getTenantSequelize(req.tenant);
    const [payment] = await sequelize.query<PaymentRow>(

      `SELECT id, registration_id, fee_type, amount, status, gateway_transaction_id
       FROM payments
       WHERE gateway_transaction_id = :orderId`,

      {
        replacements: { orderId: merchantOrderId },
        type: QueryTypes.SELECT,
      }

    );

    if (!payment) {

      return res.status(404).json({
        status: 0,
        message: "Payment record not found",
      });

    }

    return res.status(200).json({
      status: 1,
      message: "Payment record found",
      data: {
        payment_id: payment.id,
        registration_id: payment.registration_id,
        fee_type: payment.fee_type,
        amount: payment.amount,
        status: payment.status,
        gateway_transaction_id: payment.gateway_transaction_id,
      },
    });

  } catch (error) {

    return res.status(500).json({
      status: 0,
      message: getErrorMessage(error),
    });

  }

};

/* =====================================================
Connectivity Test
===================================================== */

export const testPhonePe = async (
  req, res: Response
) => {

  try {

    const testOrderId = `TEST-${Date.now()}`;

    const statusResponse =
      await phonePeService.checkPaymentStatus(
        testOrderId, req.tenant
      );

    return res.status(200).json({
      status: 1,
      message: "PhonePe connection successful",
      data: statusResponse,
    });

  } catch (error) {

    return res.status(500).json({
      status: 0,
      message: getErrorMessage(error),
    });

  }

};