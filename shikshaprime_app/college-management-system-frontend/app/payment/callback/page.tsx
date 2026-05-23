"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";

import {
  isSuccessStatus,
  reconcilePublicPaymentCallback,
} from "@/src/services/paymentService";

import { useApi } from "@/src/hooks/useApi";
import { processOnlinePayment } from "@/src/services/feeCollectionService";

type CallbackState = "loading" | "success" | "pending" | "failed" | "error";

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<CallbackState>("loading");
  const [message, setMessage] = useState("Verifying your payment. Please wait...");
  const [accountingMessage, setAccountingMessage] = useState("");

  // Extract merchantOrderId from callback params
  const merchantOrderId = useMemo(
    () =>
      searchParams.get("merchantOrderId") ||
      searchParams.get("txnId") ||
      searchParams.get("transactionId") ||
      "",
    [searchParams]
  );

  // useApi hook for accounting workflow
  const {
    data: accountingResult,
    loading: accountingLoading,
    call: runAccounting,
  } = useApi(processOnlinePayment);

  useEffect(() => {
    const checkStatus = async () => {
      if (!merchantOrderId) {
        setStatus("error");
        setMessage("Invalid payment callback parameters.");
        return;
      }

      try {
        // 1️⃣ Verify payment with payment-service
        const response = await reconcilePublicPaymentCallback(merchantOrderId);

        if (!isSuccessStatus(response.status) || !response.data) {
          throw new Error(response.message || "Failed to verify payment status");
        }

        const gatewayState = String(response.data.state || "").toUpperCase();

        // 2️⃣ Payment COMPLETED → trigger accounting workflow
        if (gatewayState === "COMPLETED") {
          setStatus("success");
          setMessage("Payment completed successfully.");

          try {
            setAccountingMessage("Generating receipt and updating accounts...");

            const result = await runAccounting(merchantOrderId);

            // result = { receipt_no, voucher_no, amount, student_id }
            setAccountingMessage(
              `Receipt generated successfully. Receipt No: ${result.receipt_no}`
            );

          } catch (err) {
            console.error("Accounting error:", err);
            setAccountingMessage(
              "Payment successful, but receipt generation failed. Please contact admin."
            );
          }

          return;
        }

        // 3️⃣ Payment PENDING
        if (gatewayState === "PENDING") {
          setStatus("pending");
          setMessage("Payment is being processed. Please wait and check again shortly.");
          return;
        }

        // 4️⃣ Payment FAILED
        if (gatewayState === "FAILED") {
          setStatus("failed");
          setMessage("Payment failed. Please try again.");
          return;
        }

        // 5️⃣ Unknown state
        setStatus("error");
        setMessage("Unable to determine the payment status.");
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error ? error.message : "Failed to verify payment status"
        );
      }
    };

    checkStatus();
  }, [merchantOrderId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,rgba(78,0,69,0.92)_0%,rgba(34,15,77,0.94)_42%,rgba(6,23,67,0.96)_100%),url('/images/bg.png')] bg-cover bg-center px-4 py-8">
      <div className="w-full max-w-lg rounded-[8px] border border-white/20 bg-white/10 p-8 text-center text-white shadow-2xl backdrop-blur-xl">

        {/* LOADING STATE */}
        {status === "loading" && (
          <>
            <Loader />
            <h1 className="mt-6 text-2xl font-bold">Processing Payment</h1>
            <p className="mt-3 text-sm text-white/80">{message}</p>
          </>
        )}

        {/* RESULT STATES */}
        {status !== "loading" && (
          <>
            <div
              className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${
                status === "success"
                  ? "bg-emerald-500/20 text-emerald-200"
                  : status === "pending"
                  ? "bg-amber-500/20 text-amber-100"
                  : status === "failed"
                  ? "bg-rose-500/20 text-rose-100"
                  : "bg-yellow-500/20 text-yellow-100"
              }`}
            >
              {status === "success" && (
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {status === "pending" && (
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3" />
                </svg>
              )}
              {status === "failed" && (
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {status === "error" && (
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-7.938 4h15.876c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              )}
            </div>

            <h1 className="text-2xl font-bold">
              {status === "success" && "Payment Successful"}
              {status === "pending" && "Payment Pending"}
              {status === "failed" && "Payment Failed"}
              {status === "error" && "Processing Error"}
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/80">{message}</p>

            {/* ACCOUNTING STATUS */}
            {status === "success" && (
              <p className="mt-4 text-sm text-emerald-200">
                {accountingLoading
                  ? "Updating accounts and generating receipt..."
                  : accountingMessage}
              </p>
            )}

            <div className="mt-6 flex justify-center">
              <Button
                type="button"
                className="min-w-[190px] rounded-[8px] border-0 bg-[linear-gradient(90deg,#FFB000_0%,#FF8F1F_45%,#F45B44_100%)] text-white hover:opacity-95"
                onClick={() => router.push("/student-payment")}
              >
                Return to Payment Page
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<Loader />}>
      <PaymentCallbackContent />
    </Suspense>
  );
}