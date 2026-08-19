import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { PaymentService } from './payment.service';

export const listPayments = asyncHandler(async (req: Request, res: Response) => {
  const studentId = req.params.studentId;
  const result = await PaymentService.listPayments(studentId, req.tenant!);
  sendSuccess(res, result);
});

export const listPaymentsFromToken = asyncHandler(async (req: Request, res: Response) => {
  const studentId = req.user!.user_code!;
  const result = await PaymentService.listPayments(studentId, req.tenant!);
  sendSuccess(res, result);
});

export const getPaymentDetail = asyncHandler(async (req: Request, res: Response) => {
  const result = await PaymentService.getPaymentDetail(Number(req.params.id), req.tenant!);
  sendSuccess(res, result);
});

export const initiatePayment = asyncHandler(async (req: Request, res: Response) => {
  const studentId = req.user!.user_code!;
  const { amount, description, callback_url } = req.body;
  const result = await PaymentService.initiatePayment(studentId, Number(amount), description, callback_url, req.tenant!);
  sendSuccess(res, result, 'Payment initiated', 201);
});

export const getPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const result = await PaymentService.getPaymentStatus(req.params.merchantOrderId, req.tenant!);
  sendSuccess(res, result);
});

export const getPaymentSummary = asyncHandler(async (req: Request, res: Response) => {
  const studentId = req.user!.user_code!;
  const result = await PaymentService.getPaymentSummary(studentId, req.tenant!);
  sendSuccess(res, result);
});

export const getPaymentHistory = asyncHandler(async (req: Request, res: Response) => {
  const studentId = req.user!.user_code!;
  const result = await PaymentService.getPaymentHistory(studentId, req.tenant!);
  sendSuccess(res, result);
});

export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  const { response: encodedResponse } = req.body;
  const checksum = req.headers['x-verify'] as string;
  const result = await PaymentService.handleWebhook(encodedResponse, checksum, req.tenant!);
  sendSuccess(res, result);
});

export const testRedirect = (_req: Request, res: Response) => {
  res.send('<html><body><h1>Payment Redirect</h1><p>This is a test redirect page.</p></body></html>');
};
