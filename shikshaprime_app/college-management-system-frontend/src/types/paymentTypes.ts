// Payment Types - TypeScript interfaces for Payment Management

// Payment Type (e.g., Tuition Fee, Exam Fee, etc.)
export interface PaymentType {
  id: number;
  name: string;
  description: string | null;
  amount: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Student Payment Assignment
export interface StudentPayment {
  payment_id: number;
  student_id: number;
  class_id: number | null;
  program_id: number | null;
  department_id: number | null;
  payment_type_id: string;
  payment_type_name: string;
  amount: number;
  paid_amount: number;
  due_date: string;
  paid_date: string | null;
  status: 'pending' | 'paid' | 'partial' | 'overdue';
  created_at: string;
  updated_at: string;  
  transactions?: PaymentTransaction[];
}

// Payment Transaction (individual payment records)
export interface PaymentTransaction {
  id: number;
  student_payment_id: number;
  amount_paid: number;
  payment_method: 'cash' | 'upi' | 'bank_transfer' | 'card' | 'cheque' | 'other';
  transaction_ref: string | null;
  receipt_number: string;
  notes: string | null;
  created_by: number | null;
  created_at: string;
}

// Dashboard Statistics
export interface DashboardStats {
  overview: {
    total_payments: number;
    total_amount: number;
    total_collected: number;
    total_pending: number;
    paid_count: number;
    pending_count: number;
    overdue_count: number;
    partial_count: number;
  };
  paymentTypeBreakdown: PaymentTypeBreakdown[];
}

export interface PaymentTypeBreakdown {
  id: number;
  name: string;
  total_assignments: number;
  total_amount: number;
  collected_amount: number;
  pending_amount: number;
}

// Defaulter Record
export interface Defaulter {
  id: number;
  student_id: number;
  class_id: number | null;
  section_id: number | null;
  amount: number;
  paid_amount: number;
  pending_amount: number;
  due_date: string;
  status: string;
  payment_type: string;
  student_name?: string;
  roll_number?: string;
}

// ========== Request Payloads ==========

// Create/Update Payment Type
export interface PaymentTypePayload {
  name: string;
  description?: string;
  amount?: number | null;
  is_active?: boolean;
}

// Assign Payment to Students
export interface AssignPaymentPayload {
  student_ids: number[];
  payment_type_id: number;
  amount: number;
  due_date: string;
  status?: 'pending' | 'paid' | 'partial' | 'overdue';
}

// Record Payment Transaction
export interface RecordPaymentPayload {
  amount_paid: number;
  payment_method: 'cash' | 'upi' | 'bank_transfer' | 'card' | 'cheque' | 'other';
  transaction_ref?: string;
  notes?: string;
  created_by?: number;
}

// ========== Filter Types ==========

export interface PaymentFilter {
  classId?: number;
  programId?: number;
  departmentId?: number;
  academicYearId?: number;
  status?: 'pending' | 'paid' | 'partial' | 'overdue';
  paymentTypeId?: number;
  studentId?: number;
  studentEmail?: string;
}

export interface DashboardFilter {
  class_id?: number;
  section_id?: number;
}

// ========== API Response Types ==========

export interface PaymentApiResponse<T> {
  status: number;
  message: string;
  data: T;
}
