import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess, sendError } from '../utils/response';
import { paymentService } from '../services/payment.service';
import { InitiatePaymentRequest } from '../types/payment.types';

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const tenant = req.tenant as string;
  const token = req.token as string;

  const result = await paymentService.getSummary(user.user_code, token, tenant);
  sendSuccess(res, result, 'Payment summary fetched');
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const tenant = req.tenant as string;
  const token = req.token as string;

  const result = await paymentService.getHistory(user.user_code, token, tenant);
  sendSuccess(res, result, 'Payment history fetched');
});

export const initiatePayment = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const token = req.token as string;
  const { paymentId, amount } = req.body as InitiatePaymentRequest;

  if (!paymentId) {
    sendError(res, 400, 'paymentId is required');
    return;
  }

  const result = await paymentService.initiatePayment(paymentId, amount, token, tenant);
  sendSuccess(res, result, 'Payment initiated');
});

export const getPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const tenant = req.tenant as string;
  const token = req.token as string;
  const { paymentId } = req.params;

  const result = await paymentService.getPaymentStatus(paymentId, token, tenant);
  sendSuccess(res, result, 'Payment status fetched');
});

export const getLedger = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const tenant = req.tenant as string;
  const token = req.token as string;

  const result = await paymentService.getLedger(user.user_code, token, tenant);
  sendSuccess(res, result, 'Ledger fetched');
});
