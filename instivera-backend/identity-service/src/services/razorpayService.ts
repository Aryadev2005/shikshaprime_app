import crypto from "crypto";
import Razorpay from "razorpay";
import { config } from "../config";

type CreateOrderInput = {
  amountInPaise: number;
  receipt: string;
  notes?: Record<string, string>;
};

export class RazorpayService {
  private client: Razorpay;

  constructor() {
    this.client = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
  }

  async createOrder(input: CreateOrderInput) {
    return await this.client.orders.create({
      amount: Math.round(Number(input.amountInPaise)),
      currency: "INR",
      receipt: input.receipt,
      notes: input.notes || {},
    });
  }

  verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
    const expectedSignature = crypto
      .createHmac("sha256", config.razorpay.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    return expectedSignature === signature;
  }

  async fetchPayment(paymentId: string) {
    return await this.client.payments.fetch(paymentId);
  }
}
