/** The user object identity-service returns from /authenticate-user. */
export interface MobileUser {
  user_code: string;
  username: string;
  name: string;
  role: string;
  user_type: string;
  email: string;
  phone: string;
  institute_code: string;
  access_code: string;
  is_email_verified: 0 | 1;
  is_phone_verified: 0 | 1;
  institution?: unknown;
}

export interface ApiResponse<T = any> {
  status: 1 | 0;
  data: T;
  message: string;
  token?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: MobileUser;
  token: string;
}

export interface SendOtpRequest {
  email: string;
}

export interface SendOtpResponse {
  email: string;
  expiresIn: number;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

// verify-email-otp only confirms the code; it does not issue a token.
export interface VerifyOtpResponse {
  email: string;
  verified: boolean;
}

export interface ValidateEmailRequest {
  email: string;
}

export interface ValidateEmailResponse {
  exists: boolean;
  first_name?: string;
  last_name?: string;
}
