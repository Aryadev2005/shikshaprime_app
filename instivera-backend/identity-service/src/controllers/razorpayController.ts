import { NextFunction, Response } from "express";
import { AppError } from "../utils/appError";
import { config } from "../config";
import { RazorpayService } from "../services/razorpayService";

const razorpayService = new RazorpayService();

export const createRazorpayOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { amount, userId, merchantOrderId, remarks } = req.body;

    if (!amount || !merchantOrderId) {
      throw new AppError("amount and merchantOrderId are required", 400);
    }

    const order = await razorpayService.createOrder({
      amountInPaise: Number(amount),
      receipt: String(merchantOrderId),
      notes: {
        merchantOrderId: String(merchantOrderId),
        tenant: String(req.tenant || ""),
        userId: String(userId || ""),
        remarks: String(remarks || ""),
      },
    });

    return res.status(200).json({
      status: 1,
      message: "Razorpay order created successfully",
      data: {
        provider: "razorpay",
        merchant_order_id: merchantOrderId,
        merchantOrderId: merchantOrderId,
        razorpay_order_id: order.id,
        razorpay_key_id: config.razorpay.keyId,
        amount: Number(amount) / 100,
        currency: order.currency || "INR",
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyRazorpayOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new AppError("razorpay_order_id, razorpay_payment_id and razorpay_signature are required", 400);
    }

    const isValid = razorpayService.verifyPaymentSignature(
      String(razorpay_order_id),
      String(razorpay_payment_id),
      String(razorpay_signature)
    );

    if (!isValid) {
      throw new AppError("Invalid Razorpay signature", 400);
    }

    const payment = await razorpayService.fetchPayment(String(razorpay_payment_id));

    return res.status(200).json({
      status: 1,
      message: "Razorpay payment verified successfully",
      data: {
        verified: true,
        payment,
      },
    });
  } catch (error) {
    next(error);
  }
};
