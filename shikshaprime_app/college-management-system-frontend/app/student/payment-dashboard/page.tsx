"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import useRoleGuard from "@/src/hooks/useRoleGuard";
import { AuthContext } from "@/src/context/authContext";
import { useNotify } from "@/src/context/notificationContext";
import { useApi } from "@/src/hooks/useApi";
import { getStudentPayments } from "@/src/services/paymentService";
import { StudentPayment } from "@/src/types/paymentTypes";
import PaymentModal from "@/components/ui/PaymentModal";
import { Loader } from "@/components/ui/loader";
import { IndianRupee, CheckCircle, Clock, AlertTriangle, Lock, Wallet, FileText } from "lucide-react";
import { useAppSelector } from "@/src/store/hooks";
import apiClient from "@/src/services/apiClient";
import "./payment-dashboard.css";

type StatusFilter = "all" | "paid" | "pending" | "overdue" | "partial";

type PaymentRow = StudentPayment & {
  payment_id?: number;
  payment_type_name?: string;
  student_name?: string;
};

export default function StudentPaymentDashboard() {
  const user = useRoleGuard("student");
  const authCtx = useContext(AuthContext);
  const notify = useNotify();
  const studentDetails = useAppSelector((state) => state.stuDetails.StudentDetails);

  const paymentsApi = useApi(getStudentPayments);

  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(null);
  const [paymentOrderData, setPaymentOrderData] = useState<any>(null);
  const [payingId, setPayingId] = useState<number | null>(null);

  const studentId = studentDetails?.id ?? (authCtx?.user?.user_id ? Number(authCtx.user.user_id) : undefined);
  const studentEmail = studentDetails?.email ?? authCtx?.user?.email;

  useEffect(() => {
    if (studentId || studentEmail) {
      fetchPayments();
    }
    // Check for payment callback
    const searchParams = new URLSearchParams(window.location.search);
    const merchantOrderId = searchParams.get('merchantOrderId');
    if (merchantOrderId) {
      verifyPaymentCallback(merchantOrderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, studentEmail]);

  const fetchPayments = async () => {
    try {
      const result = await paymentsApi.call({ studentId, studentEmail });
      if (result.status === 1 && result.data) {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const filtered = (result.data || []).filter((p: any) => {
          const createdDate = new Date(p.created_at);
          return createdDate >= sixMonthsAgo;
        });
        setPayments(filtered as PaymentRow[]);
      }
    } catch (err) {
      console.error("Error fetching payments:", err);
      notify.error("Error", "Failed to load your payments");
    }
  };

  const stats = useMemo(() => {
    const totalAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const paidAmount = payments.reduce((sum, p) => sum + (Number(p.paid_amount) || 0), 0);
    const pendingPayments = payments.filter((p) => p.status === "pending" || p.status === "partial");
    const overduePayments = payments.filter((p) => p.status === "overdue");
    const paidPayments = payments.filter((p) => p.status === "paid");
    const pendingAmount = pendingPayments.reduce((sum, p) => sum + (Number(p.amount) - Number(p.paid_amount || 0)), 0);
    const overdueAmount = overduePayments.reduce((sum, p) => sum + (Number(p.amount) - Number(p.paid_amount || 0)), 0);
    return {
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount,
      paidCount: paidPayments.length,
      pendingCount: pendingPayments.length,
      overdueCount: overduePayments.length,
    };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    if (statusFilter === "all") return payments;
    if (statusFilter === "pending") return payments.filter((p) => p.status === "pending" || p.status === "partial");
    return payments.filter((p) => p.status === statusFilter);
  }, [payments, statusFilter]);

  const formatCurrency = (amount?: number | null) => {
    if (amount === null || amount === undefined) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getBadgeClass = (status?: string) => {
    switch (status) {
      case "paid":
        return "badge-paid";
      case "pending":
        return "badge-pending";
      case "overdue":
        return "badge-overdue";
      case "partial":
        return "badge-partial";
      default:
        return "";
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "paid":
        return "Paid";
      case "pending":
        return "Pending";
      case "overdue":
        return "Overdue";
      case "partial":
        return "Partial";
      default:
        return status ?? "";
    }
  };

  const handlePayClick = async (payment: PaymentRow) => {
    if (!payment?.payment_id) return;
    setPayingId(payment.payment_id);
    setSelectedPayment(payment);
    try {
      const remainingAmount = Number(payment.amount) - Number(payment.paid_amount || 0);
      const { data } = await apiClient.post(`/payment/students/${payment.payment_id}/initiate`, {
        amount: remainingAmount,
      });
      if (data.status === 1 && data.data?.redirectUrl) {
        // Redirect to PhonePe payment gateway
        window.location.href = data.data.redirectUrl;
      } else {
        throw new Error(data.message || "Failed to initiate payment");
      }
    } catch (err: any) {
      console.error("Payment initiation error:", err);
      notify.error("Payment Error", err?.message || "Failed to initiate payment. Please try again.");
      setPayingId(null);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    setSelectedPayment(null);
    setPaymentOrderData(null);
    notify.success("Payment Successful", "Your payment has been processed successfully!");
    await fetchPayments();
  };

  const handlePaymentError = (msg: string) => {
    setShowPaymentModal(false);
    setSelectedPayment(null);
    setPaymentOrderData(null);
    notify.error("Payment Failed", msg);
  };

  const verifyPaymentCallback = async (merchantOrderId: string) => {
    try {
      // Extract paymentId from merchantOrderId (SP-{paymentId}-{timestamp})
      const parts = merchantOrderId.split('-');
      if (parts.length < 2) return;
      const paymentId = parseInt(parts[1]);
      
      if (isNaN(paymentId)) return;

      const { data } = await apiClient.get(`/payment/students/${paymentId}/status`);
      
      if (data?.data?.gatewayStatus === 'COMPLETED') {
        notify.success("Success", "Payment completed successfully!");
        await fetchPayments();
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (data?.data?.gatewayStatus === 'FAILED') {
        notify.error("Payment Failed", "Your payment was not completed. Please try again.");
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      // Don't show error notification during auto-verification
    }
  };

  if (!user) return null;

  const studentName = studentDetails?.student_name || `${authCtx?.user?.first_name ?? ""} ${authCtx?.user?.last_name ?? ""}`.trim();

  return (
    <div className="student-pay-dashboard">
      {paymentsApi.loading && <Loader />}

      <div className="spd-page-header">
        <h1 className="spd-page-title text-dark text-lg font-semibold">My Payments</h1>
        <p className="sva-page-subtitle text-gray-color text-sm">View and pay your assigned fees for the last 6 months</p>
      </div>

      <div className="spd-stats-grid">
        <div className="stats-card card-total">
          <div className="stat-icon-wrapper">
            <IndianRupee size={24} />
          </div>
          <div className="stat-info">
            
            <span className="stat-value">{formatCurrency(stats.totalAmount)}</span>
            <span className="spd-stat-count"><span className="stat-label">Total Dues</span> | {payments.length} payment(s)</span>
          </div>
        </div>
        <div className="stats-card card-submitted">
          <div className="stat-icon-wrapper">
            <CheckCircle size={22} />
          </div>
          <div className="stat-info">
            
            <span className="stat-value">{formatCurrency(stats.paidAmount)}</span>
            <span className="spd-stat-count"><span className="stat-label">Paid</span> | {stats.paidCount} completed</span>
          </div>
        </div>
        <div className="stats-card card-pending">
          <div className="stat-icon-wrapper">
            <Clock size={22} />
          </div>
          <div className="stat-info">
            
            <span className="stat-value">{formatCurrency(stats.pendingAmount)}</span>
            <span className="spd-stat-count"><span className="stat-label">Pending</span> | {stats.pendingCount} pending</span>
          </div>
        </div>
        <div className="stats-card card-overdue">
          <div className="stat-icon-wrapper">
            <AlertTriangle size={22} />
          </div>
          <div className="stat-info">
            
            <span className="stat-value">{formatCurrency(stats.overdueAmount)}</span>
            <span className="spd-stat-count"><span className="stat-label">Overdue</span> | {stats.overdueCount} overdue</span>
          </div>
        </div>
      </div>

      <div className="spd-filter-bar">
        <div className="spd-filter">
          <button className={statusFilter === "all" ? "active" : ""} onClick={() => setStatusFilter("all")}>All</button>
          <button className={statusFilter === "pending" ? "active" : ""} onClick={() => setStatusFilter("pending")}>Pending</button>
          <button className={statusFilter === "partial" ? "active" : ""} onClick={() => setStatusFilter("partial")}>Partial</button>
          <button className={statusFilter === "overdue" ? "active" : ""} onClick={() => setStatusFilter("overdue")}>Overdue</button>
          <button className={statusFilter === "paid" ? "active" : ""} onClick={() => setStatusFilter("paid")}>Paid</button>
        </div>
      </div>

      <div className="spd-table-wrapper">
        {paymentsApi.loading ? (
          <div className="spd-skeleton">
            {[1, 2, 3, 4, 5].map((i) => (
              <div className="spd-skeleton-row" key={i}>
                <div className="spd-skeleton-cell" style={{ width: "30px" }} />
                <div className="spd-skeleton-cell" style={{ width: "120px" }} />
                <div className="spd-skeleton-cell" style={{ width: "90px" }} />
                <div className="spd-skeleton-cell" style={{ width: "90px" }} />
                <div className="spd-skeleton-cell" style={{ width: "120px" }} />
                <div className="spd-skeleton-cell" style={{ width: "80px" }} />
                <div className="spd-skeleton-cell" style={{ width: "70px" }} />
                <div className="spd-skeleton-cell" style={{ width: "100px" }} />
              </div>
            ))}
          </div>
        ) : (
          <table className="spd-table custom-student-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Payment Type</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty">No payments found</td>
                </tr>
              )}
              {filteredPayments.map((payment, idx) => {
                const due = Number(payment.amount) - Number(payment.paid_amount || 0);
                return (
                  <tr key={payment.payment_id || idx}>
                    <td>{idx + 1}</td>
                    <td>
                      <div className="spd-type">
                        <Wallet size={16} />
                        <div>
                          <div className="spd-type-name">{payment.payment_type_name || "Payment"}</div>
                          <div className="spd-student">{studentName || payment.student_name}</div>
                        </div>
                      </div>
                    </td>
                    <td>{formatCurrency(Number(payment.amount))}</td>
                    <td>{formatCurrency(Number(payment.paid_amount))}</td>
                    <td>{formatDate(payment.due_date as any)}</td>
                    <td>
                      <span className={`spd-badge ${getBadgeClass(payment.status)}`}>
                        {getStatusLabel(payment.status)}
                      </span>
                    </td>
                    <td>
                      <div className="spd-actions">
                        <button
                          className="pay-btn"
                          disabled={payment.status === "paid" || payingId === payment.payment_id}
                          onClick={() => handlePayClick(payment)}
                        >
                          {payingId === payment.payment_id ? "Processing..." : due > 0 ? `Pay ${formatCurrency(due)}` : "Pay"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <PaymentModal
        show={showPaymentModal}
        onHide={() => setShowPaymentModal(false)}
        amount={Number(selectedPayment?.amount || 0) - Number(selectedPayment?.paid_amount || 0)}
        studentData={{
          id: studentId || 0,
          firstName: studentName?.split(" ")[0] || "Student",
          lastName: studentName?.split(" ").slice(1).join(" ") || "",
          email: studentEmail || "",
          phone: studentDetails?.mobile || "",
          feeType: selectedPayment?.payment_type_name,
        }}
        paymentOrderData={paymentOrderData}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
      />
    </div>
  );
}
