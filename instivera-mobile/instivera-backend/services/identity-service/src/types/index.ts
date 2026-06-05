export interface IdentityLoginResponse {
  status: 1;
  data: {
    user: {
      user_id: number;
      username: string;
      email: string;
      role: string;
      user_type: string;
      user_code: string;
    };
    token: string;
  };
  message: string;
}

export interface IdentityValidateEmailResponse {
  status: 1;
  data: {
    exists: boolean;
    user_id?: number;
    first_name?: string;
    last_name?: string;
  };
  message: string;
}

export interface IdentitySendOtpResponse {
  status: 1;
  data: {
    email: string;
    expiresIn: number;
  };
  message: string;
}

export interface IdentityVerifyOtpResponse {
  status: 1;
  data: {
    email: string;
    verified: boolean;
  };
  message: string;
}

export interface IdentityErrorResponse {
  status: 0;
  data?: any;
  message: string;
}
