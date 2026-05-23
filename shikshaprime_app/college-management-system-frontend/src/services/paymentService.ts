// Payment Service - Using apiClient through NGINX gateway
import axios from "axios";
import apiClient from "./apiClient";
import {
  PaymentType,
  StudentPayment,
  PaymentTransaction,
  DashboardStats,
  Defaulter,
  PaymentTypePayload,
  AssignPaymentPayload,
  RecordPaymentPayload,
  PaymentFilter,
  DashboardFilter,
} from "../types/paymentTypes";

// ========== Payment Type APIs ==========

// Get all payment types
export async function getAllPaymentTypes() {
  const { data } = await apiClient.get("/payment/types");
  return { status: data.status, data: data.data as PaymentType[], message: data.message };
}

// Get active payment types only
export async function getActivePaymentTypes() {
  const { data } = await apiClient.get("/payment/types/active");
  return { status: data.status, data: data.data as PaymentType[], message: data.message };
}

// Get payment type by ID
export async function getPaymentTypeById(id: number) {
  const { data } = await apiClient.get(`/payment/types/${id}`);
  return { status: data.status, data: data.data as PaymentType, message: data.message };
}

// Create new payment type
export async function createPaymentType(payload: PaymentTypePayload) {
  const { data } = await apiClient.post("/payment/types", payload);
  return { status: data.status, data: data.data as PaymentType, message: data.message };
}

// Update payment type
export async function updatePaymentType(id: number, payload: PaymentTypePayload) {
  const { data } = await apiClient.put(`/payment/types/${id}`, payload);
  return { status: data.status, data: data.data as PaymentType, message: data.message };
}

// Delete payment type
export async function deletePaymentType(id: number) {
  const { data } = await apiClient.delete(`/payment/types/${id}`);
  return { status: data.status, data: data.data, message: data.message };
}

// ========== Student Payment APIs ==========

// Assign payment to students (by class or individually)
export async function assignPayment(payload: AssignPaymentPayload) {
  const { data } = await apiClient.post("/payment/students/assign", payload);
  return { status: data.status, data: data.data as StudentPayment[], message: data.message };
}

// Get student payments with filters
export async function getStudentPayments(filters?: PaymentFilter) {
  let url = "/payment/students";
  if (filters?.status) {
    url += `?status=${filters.status}`;
  }
  const { data } = await apiClient.get(url);
  return { status: data.status, data: data.data as StudentPayment[], message: data.message };
}

// Get single payment by ID
export async function getPaymentById(id: number) {
  const { data } = await apiClient.get(`/payment/students/${id}`);
  return { status: data.status, data: data.data as StudentPayment, message: data.message };
}

// Record a payment transaction
export async function recordPayment(paymentId: number, payload: RecordPaymentPayload) {
  const { data } = await apiClient.post(`/payment/students/${paymentId}/pay`, payload);
  return {
    status: data.status,
    data: data.data as { transaction: PaymentTransaction; updatedPayment: StudentPayment },
    message: data.message
  };
}

// Update student payment status
export async function updateStudentPaymentStatus(paymentId: number, status: string) {
  const { data } = await apiClient.put(`/payment/students/${paymentId}/status`, { status });
  return { status: data.status, data: data.data as StudentPayment, message: data.message };
}

// Delete student payment
export async function deleteStudentPayment(paymentId: number) {
  const { data } = await apiClient.delete(`/payment/students/${paymentId}`);
  return { status: data.status, data: data.data, message: data.message };
}

// ========== Dashboard APIs ==========

// Get dashboard statistics
export async function getDashboardStats(filters?: DashboardFilter) {
  const { data } = await apiClient.get("/payment/dashboard/stats", { params: filters });
  return { status: data.status, data: data.data as DashboardStats, message: data.message };
}

// Get defaulters list
export async function getDefaulters(filters?: DashboardFilter) {
  const { data } = await apiClient.get("/payment/dashboard/defaulters", { params: filters });
  return { status: data.status, data: data.data as Defaulter[], message: data.message };
}

// ========== Payment Gateway APIs ==========

// Initiate payment with PhonePe gateway
export async function initiatePaymentGateway(paymentId: number, amount?: number) {
  const { data } = await apiClient.post(`/payment/students/${paymentId}/initiate`, {
    amount,
  });
  return {
    status: data.status,
    data: data.data as {
      paymentId: number;
      merchantOrderId: string;
      amount: number;
      redirectUrl: string;
      expiresAt?: number;
    },
    message: data.message,
  };
}

// Check payment status with gateway
export async function checkPaymentStatus(paymentId: number) {
  const { data } = await apiClient.get(`/payment/students/${paymentId}/status`);
  return {
    status: data.status,
    data: data.data as {
      paymentId: number;
      gatewayStatus?: string;
      studentPaymentStatus: string;
    },
    message: data.message,
  };
}

// ========== Legacy Export for backward compatibility ==========

export const PaymentAPI = {
  // Payment Types
  getAllPaymentTypes,
  getActivePaymentTypes,
  getPaymentTypeById,
  createPaymentType,
  updatePaymentType,
  deletePaymentType,

  // Student Payments
  assignPayment,
  getStudentPayments,
  getPaymentById,
  recordPayment,
  updateStudentPaymentStatus,
  deleteStudentPayment,

  // Dashboard
  getDashboardStats,
  getDefaulters,

  // Payment Gateway
  initiatePaymentGateway,
  checkPaymentStatus,
};

export type PublicPaymentType = {
  id: number;
  name: string;
  description?: string | null;
  amount?: number | null;
  is_active?: boolean;
};

export type PublicStudentPaymentLookup = {
  student: {
    id: number;
    student_id?: string | null;
    university_registration_number?: string | null;
    student_name?: string | null;
    class_name?: string | null;
    semester?: string | null;
    program?: string | null;
    department?: string | null;
    mobile?: string | null;
    email?: string | null;
    academic_year?: string | null;
  } | null;
  payment: {
    payment_id: number;
    amount: number;
    paid_amount: number;
    status: string;
    due_date?: string | null;
    gateway_transaction_id?: string | null;
  } | null;
  paymentType?: PublicPaymentType | null;
};

type PublicApiResponse<T> = {
  status: number | string;
  data: T;
  message?: string;
};

type StudentLookupPayload = {
  identifier: string;
  lookupType: "registration" | "student_id";
  paymentTypeId: number;
};

type PublicInitiatePayload = {
  paymentId: number;
  amount: number;
  remarks?: string;
};

function getTenantFromCookie(): string {
  if (typeof document === "undefined") {
    return "";
  }

  const tenantCookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("tenant="));

  if (tenantCookie) {
    return tenantCookie.split("=")[1] || "";
  }

  const host = window.location.hostname;
  const hostParts = host.split(".");
  if (hostParts.length > 2) {
    return hostParts[0];
  }

  return "";
}

export function isSuccessStatus(status: unknown) {
  return status === 1 || status === "success";
}

export async function getPublicPaymentTypes() {
  const { data } = await apiClient.get("/payment/types/public");
  return {
    status: data.status,
    data: (data.data || []) as PublicPaymentType[],
    message: data.message,
  };
}

export async function lookupPublicStudentPayment(payload: StudentLookupPayload) {
  const { data } = await apiClient.get("/payment/students/public-lookup", {
    params: payload,
  });

  return {
    status: data.status,
    data: (data.data || null) as PublicStudentPaymentLookup,
    message: data.message,
  };
}

export async function initiatePublicStudentPayment(payload: PublicInitiatePayload) {
  const { data } = await apiClient.post("/payment/students/public/initiate", payload);

  return {
    status: data.status,
    data: data.data as {
      paymentId: number;
      merchantOrderId: string;
      amount: number;
      redirectUrl: string;
      expiresAt?: number;
    },
    message: data.message,
  };
}

export async function reconcilePublicPaymentCallback(merchantOrderId: string) {
  const { data } = await apiClient.get("/payment/students/public/callback-status", {
    params: { merchantOrderId },
  });

  return {
    status: data.status,
    data: data.data as {
      paymentId: number;
      merchantOrderId: string;
      state: string;
      studentPaymentStatus: string;
      gatewayResponse?: unknown;
    },
    message: data.message,
  };
}
