import { config } from '../config';

interface RegistrationData {
  id: number;
  registration_id: string;
  mode: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  class_id: number;
  department_id: number;
  department_name: string;
  program_id: number;
  program_name: string;
  academic_year_id: number;
  father_name: string;
  mother_name?: string;
  mobile: string;
  email: string;
  address_line?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  previous_school_name?: string;
  last_class_passed?: string;
  board_university?: string;
  board_university_10th?: string;
  ten_percentage?: number;
  year_of_passing_10th?: string;
  board_university_12th?: string;
  twelve_percentage?: number;
  year_of_passing_12th?: string;
  board_university_graduation?: string;
  graduation_percentage?: number;
  year_of_passing_graduation?: string;
  caste?: string;
  degree?: string;
  id_proof_type?: string;
  id_proof_number?: string;
  nationality?: string;
  religion? : string;
  is_physically_challenged: number;
  guardian_name?: string;
  guardian_mobile?: string;
  guardian_email?: string;
  aadhar_doc?: string | null;
  birth_certificate_doc?: string | null;
  ten_marksheet_doc?: string | null;
  twelve_marksheet_doc?: string | null;
  graduation_doc? : string | null;
  caste_certificate_doc? : string | null;
  physically_challenged_certificate: string | null;
  status: string;
  remarks?: string;
  entered_by_user_id?: number;
  entered_by_name?: string;
  created_at: string;
  updated_at: string;
}

export class IdentityServiceClient {
  private baseURL: string;

  constructor() {
    // You can configure this in your config file
    this.baseURL = process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001/api';
  }

  async getRegistrationById(registrationId: string, token: string, tenant: string): Promise<RegistrationData> {
    try {
      // Use the new admin endpoint which supports fetching by String ID (e.g. REG-...)
      // The original getRegistrationById was likely for numeric ID or didn't exist in the form we needed.
      // We are now targeting: /api/identity/sr/admin/registrations/by-reg-id/:regId
      const response = await fetch(`${this.baseURL}/identity/sr/admin/registrations/by-reg-id/${registrationId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token, // Pass the admin token
          'X-TENANT': tenant
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        let message = 'Unknown error';
        try {
          const body: any = await response.json();
          message = body?.message || message;
        } catch (e) {
          // ignore
        }
        throw new Error(`Identity service error: ${response.status} - ${message}`);
      }

      const responseData: any = await response.json();
      return responseData.data; // The API returns { status: 1, data: {...}, message: ... }
    } catch (error: any) {      
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        throw new Error('Identity service is not responding');
      }
      if (error.message && error.message.includes('Identity service error')) {
        throw error;
      }
      throw new Error(`Request error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}