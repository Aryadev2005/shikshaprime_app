export interface MobileUser {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  avatarInitials: string;
  userCode: string;
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

export interface VerifyOtpResponse {
  user: MobileUser;
  token: string;
}

export interface ValidateEmailRequest {
  email: string;
}

export interface ValidateEmailResponse {
  exists: boolean;
  first_name?: string;
  last_name?: string;
}
