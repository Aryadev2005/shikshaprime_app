import { Request, Response } from 'express';
import { PaymentService, verifyPhonePeWebhook } from '../services/payment.service';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess, sendError } from '../utils/response';

const paymentService = new PaymentService();

// GET /payments/:studentId  OR  /students?status=PENDING
export const listPayments = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const studentId = req.params.studentId || (req.query.student_id as string);
  const statusFilter = (req.query.status as string) || undefined;

  if (!studentId) return sendError(res, 400, 'studentId is required');

  const data = await paymentService.listPayments(studentId, tenant, statusFilter);
  sendSuccess(res, data, 'Payments retrieved successfully');
});

// GET /students endpoint used by BFF getSummary — no studentId in path, reads from token
export const listPaymentsFromToken = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const statusFilter = (req.query.status as string) || undefined;

  const user = req.user;
  const studentId = user?.user_code || user?.student_id || user?.username;
  if (!studentId) return sendError(res, 400, 'Could not resolve studentId from token');

  const data = await paymentService.listPayments(studentId, tenant, statusFilter);
  sendSuccess(res, data, 'Payments retrieved successfully');
});

// GET /payments/detail/:paymentId
export const getPaymentDetail = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const { paymentId } = req.params;
  if (!paymentId) return sendError(res, 400, 'paymentId is required');

  const data = await paymentService.getPaymentById(paymentId, tenant);
  sendSuccess(res, data, 'Payment retrieved successfully');
});

// POST /payments/initiate  OR  POST /students/:paymentId/initiate
export const initiatePayment = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const user = req.user;

  // Support both routes: body paymentId or path param
  const paymentId: string = req.body.paymentId || req.params.paymentId;
  const amount: number | undefined = req.body.amount;
  const studentId: string =
    req.body.studentId ||
    user?.user_code ||
    user?.student_id ||
    user?.username ||
    '';

  if (!paymentId) return sendError(res, 400, 'paymentId is required');

  const data = await paymentService.initiatePayment(paymentId, amount, studentId, tenant);
  sendSuccess(res, data, 'Payment initiated');
});

// GET /payments/status/:paymentId  OR  /students/:paymentId/status
export const getPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const paymentId = req.params.paymentId;
  if (!paymentId) return sendError(res, 400, 'paymentId is required');

  const data = await paymentService.getPaymentStatus(paymentId, tenant);
  sendSuccess(res, data, 'Payment status retrieved');
});

// POST /payments/webhook — no JWT auth, verify X-VERIFY signature
export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const xVerify = req.headers['x-verify'] as string;

  if (xVerify) {
    // Verify PhonePe signature
    const rawBody =
      typeof req.body.response === 'string'
        ? req.body.response
        : Buffer.from(JSON.stringify(req.body)).toString('base64');

    if (!verifyPhonePeWebhook(xVerify, rawBody)) {
      return sendError(res, 403, 'Invalid webhook signature');
    }
  }

  await paymentService.handleWebhook(req.body, tenant);
  // PhonePe expects a 200 OK
  res.status(200).json({ status: 1, data: null, message: 'Webhook processed' });
});

// GET /payments/test-redirect — dev convenience: show payment result page
export const testRedirect = (_req: Request, res: Response) => {
  const { orderId, amount } = _req.query;
  res.send(`
    <html><body style="font-family:sans-serif;text-align:center;padding:40px">
    <h2>Test Payment Page</h2>
    <p>Order: <strong>${orderId || 'N/A'}</strong></p>
    <p>Amount: <strong>₹${amount || '0'}</strong></p>
    <p style="color:gray">(PhonePe credentials not set — this is a stub page)</p>
    </body></html>
  `);
};
