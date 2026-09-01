import { apiClient } from '../client';
import {
  LoginRequest,
  LoginResponse,
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  ValidateEmailRequest,
  ValidateEmailResponse,
  ApiResponse,
  MobileUser,
} from '../../types/api';

const client = apiClient.getClient();

export const authApi = {
  // The backend returns the user in `data` and the JWT at the top level of the
  // body, so recombine them into the { user, token } shape the store expects.
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await client.post<ApiResponse<MobileUser>>(
      '/api/identity/authenticate-user',
      data,
    );
    const { data: user, token } = response.data;
    if (!token) {
      throw new Error('Login response did not include a token');
    }
    return { user, token };
  },

  async sendOtp(data: SendOtpRequest): Promise<SendOtpResponse> {
    const response = await client.post<ApiResponse<SendOtpResponse>>(
      '/api/identity/send-email-otp',
      data,
    );
    return response.data.data;
  },

  async verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    const response = await client.post<ApiResponse<VerifyOtpResponse>>(
      '/api/identity/verify-email-otp',
      data,
    );
    return response.data.data;
  },

  async validateEmail(data: ValidateEmailRequest): Promise<ValidateEmailResponse> {
    const response = await client.post<ApiResponse<ValidateEmailResponse>>(
      '/api/identity/validate-email',
      data,
    );
    return response.data.data;
  },
};