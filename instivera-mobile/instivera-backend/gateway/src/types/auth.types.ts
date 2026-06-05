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

export interface MobileLoginResponse {
  user: MobileUser;
  token: string;
}

export interface AuthLoginRequest {
  username: string;
  password: string;
}

export interface AuthSendOtpRequest {
  email: string;
}

export interface AuthVerifyOtpRequest {
  email: string;
  otp: string;
}

export interface AuthValidateEmailRequest {
  email: string;
}

// Upstream Identity Service response shapes
export interface IdentityLoginResponse {
  status: 1 | 0;
  data: {
    role: string;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    user_id: string;
    user_type: string;
    user_code: string;
  };
  token: string;
  message: string;
}

export interface IdentitySendOtpResponse {
  status: 1 | 0;
  data: {
    email: string;
    expiresIn: number;
  };
  message: string;
}

export interface IdentityVerifyOtpResponse {
  status: 1 | 0;
  data: {
    token: string;
  };
  message: string;
}

export interface IdentityVerifyOtpErrorResponse {
  status: 0;
  data: {
    attemptsLeft: number;
  };
  message: string;
}

export interface IdentityValidateEmailResponse {
  status: 1 | 0;
  data: {
    exists: boolean;
    first_name?: string;
    last_name?: string;
  };
  message: string;
}
