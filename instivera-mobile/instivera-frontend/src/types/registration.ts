export interface AcademicYear {
  id: number;
  name: string;
  year?: string;
}

export interface Program {
  id: number;
  name: string;
}

export interface Department {
  id: number;
  name: string;
  parent_id?: number;
}

export interface ClassItem {
  id: number;
  name: string;
}

export interface FeeStructure {
  fee_type: string;
  description: string;
  amount: number;
  currency: string;
}

export interface RegistrationFormData {
  // Step 1 — Personal
  first_name: string;
  last_name: string;
  date_of_birth: string; // YYYY-MM-DD
  gender: 'Male' | 'Female' | 'Other';
  mobile: string;
  email: string;
  // Step 2 — Academic
  academic_year_id: number;
  program_id: number;
  department_id: number;
  class_id: number;
  // Step 3 — Guardian
  father_name: string;
  mother_name?: string;
  guardian_mobile?: string;
  guardian_email?: string;
  // Step 4 — Address (all optional)
  address_line?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  // Step 5 — Previous Education (all optional)
  previous_school_name?: string;
  last_class_passed?: string;
  board_university_10th?: string;
  ten_percentage?: string;
  year_of_passing_10th?: string;
}

export interface RegistrationSubmitPayload extends RegistrationFormData {
  registration_id?: string;
}

export interface RegistrationResponse {
  registration_id: string;
  status: string;
  message: string;
  payment_url?: string;
}

export type RegistrationStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'REGISTRATION_PENDING'
  | 'REGISTRATION_COMPLETED'
  | 'SELECTED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_COMPLETED'
  | 'REJECTED';

export interface RegistrationStatusResponse {
  registration_id: string;
  first_name: string;
  last_name: string;
  status: RegistrationStatus;
  program_name: string;
  class_name: string;
  department_name: string;
  academic_year: string;
  created_at: string;
  payment_url?: string;
}
