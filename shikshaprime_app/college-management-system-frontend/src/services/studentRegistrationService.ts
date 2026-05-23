// Student  registration service integrating with Nginx API Gateway

import { RegisterStudent } from "@/app/online-registration/page";
import { AdmissionData } from "@/app/admin/student-admission/page";
import apiClient from "./apiClient";

export interface RegisterStudentPayment {
  registration_id: number;
  fee_type: string;
  amount: number;
  payment_mode: string;
}

export interface FeeStructure {
  fee_type: string;
  description: string;
  amount: number;
  currency: string;
}

// export interface PaymentVerification {
//   razorpay_order_id: string;
//   razorpay_payment_id: string;
//   razorpay_signature: string;
//   payment_id: number;
// }

export interface PaymentVerification {
  phonepe_merchant_transaction_id: string;
  payment_id: number;
}

export interface ListStudentRegistrations {
  searchText: string;
  classId: string;
  academicYearId: string;
  status: string;
  page: string;
  limit: string;
}

// Student Registration Online
export async function registerStudent(registerStudent: RegisterStudent) {
  // Create FormData for file uploads
  const formData = new FormData();

  // Add all text fields
  Object.keys(registerStudent).forEach(key => {
    if (key !== 'documents' && key !== 'profileImg') {
      const value = (registerStudent as any)[key];
      // Check if the value is an array (and not the documents array which is handled separately)
      if (Array.isArray(value) && key !== 'documents') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    }
  });

  // Add profile image if provided
  if (registerStudent.profileImg && registerStudent.profileImg instanceof File) {
    formData.append('profileImg', registerStudent.profileImg);
  }

  // Add document files with proper field names
  if (registerStudent.documents && registerStudent.documents.length > 0) {
    const documentFieldMap: Record<string, string> = {
      // Standard labels
      'aadhar': 'aadhar',
      'birth certificate': 'birth_certificate',
      '10 mark sheet': '10_mark_sheet',
      '12 mark sheet': '12_mark_sheet',
      'graduation': 'graduation',
      'caste certificate': 'caste_certificate',
      'physically challenged certificate': 'physically_challenged_certificate',
    };

    registerStudent.documents.forEach((doc) => {
      if (doc.file && doc.documentName) {
        const file = doc.file instanceof FileList ? doc.file[0] : doc.file;
        if (file instanceof File) {
          const fieldName = documentFieldMap[doc.documentName.toLowerCase()];
          if (fieldName) {
            formData.append(fieldName, file);
          } else {
            console.warn('Unknown document type:', doc.documentName);
          }
        }
      }
    });
  }

  const { data } = await apiClient.post("/identity/sr/register", formData);
  return { status: data.status, data: data.data, message: data.message, };
}

// Get Fee Structure
export async function getFeeStructure() {
  const { data } = await apiClient.get("/identity/sr/fee-structure");
  // console.log("getFeeStructure - API Response:", data);
  // console.log("getFeeStructure - data.data:", data.data);
  return { status: data.status, data: data.data, message: data.message };
}

// Student Registration Payment
export async function studentRegistrationPayment(payment: RegisterStudentPayment) {
  const { data } = await apiClient.post("/identity/sr/payments/initiate", payment);
  return { status: data.status, data: data.data, message: data.message };
}

// Verify Payment
export async function verifyPayment(verification: PaymentVerification) {
  const { data } = await apiClient.post("/identity/sr/payments/verify", verification);
  return { status: data.status, data: data.data, message: data.message };
}

// Get Registration by RegId
export async function getRegistrationByRegId(regId: string) {
  const { data } = await apiClient.get(`/identity/sr/registration/${regId}`);
  return { status: data.status, data: data.data, message: data.message };
}

// Student Registration by Admin
export async function registerStudentOffline(registerStudent: RegisterStudent) {
  const { data } = await apiClient.post("/identity/sr/admin/register", registerStudent);
  return { status: data.status, data: data.data, message: data.message };
}

// Fetching List of Student Registrations
export async function listStudentRegistrations(listStudentRegistrations: ListStudentRegistrations) {
  const { data } = await apiClient.get("/identity/sr/admin/registrations", { params: { ...listStudentRegistrations } });
  return { status: data.status, data: data.data.registrations, pagination: data.data.pagination, message: data.message };
}

// Update Student Registration Status
export async function updateStudentRegistrationStatus(registrationId: string, status: string) {
  const { data } = await apiClient.patch(`/identity/sr/admin/registrations/${registrationId}/status`, { status });
  return { status: data.status, data: data.data, message: data.message };
}

// Bulk Update Student Registration Status
export async function bulkUpdateStudentRegistrationStatus(registrationIds: string[], status: string) {
  const { data } = await apiClient.post(`/identity/sr/admin/registrations/bulk-status`, { registrationIds, status });
  return { status: data.status, data: data.data, message: data.message };
}
// Fetching Student By registration Id
export async function fetchStudentByRegistrationId(registrationId: string) {
  const { data } = await apiClient.get(`/identity/sr/registration/${registrationId}`);
  return { status: data.status, data: data.data, message: data.message };
}

// Update Student Registration Status
export async function resendPaymentLinkForSelectedStudent(registrationId: string) {
  const { data } = await apiClient.post(`/identity/sr/admin/registrations/resend/${registrationId}`);
  return { status: data.status, data: data.data, message: data.message };
}

// Get student data
export async function getStudentData(registrationId: string) {
  const { data } = await apiClient.get(`/identity/sr/admin/registrations/${registrationId}`);
  return { status: data.status, data: data.data, message: data.message, error: data.error };
}
export async function registerStudentAdmission(admissionFormData: any) {
  // Send only the 4 fields the backend requires
  const requestData = {
    registration_id: admissionFormData.registration_id,
    section: admissionFormData.section,
    semester: admissionFormData.semester,
    subjects: admissionFormData.subjects,
  };

  const { data } = await apiClient.post('/student/create', requestData);
  return { status: data.status, data: data.data, message: data.message, error: data.error };
}