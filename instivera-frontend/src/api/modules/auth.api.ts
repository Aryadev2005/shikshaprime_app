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
} from '../../types/api';

const client = apiClient.getClient();

export const authApi = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await client.post<ApiResponse<LoginResponse>>(
      '/auth/login',
      data,
    );
    return response.data.data;
  },

  async sendOtp(data: SendOtpRequest): Promise<SendOtpResponse> {
    const response = await client.post<ApiResponse<SendOtpResponse>>(
      '/auth/send-otp',
      data,
    );
    return response.data.data;
  },

  async verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    const response = await client.post<ApiResponse<VerifyOtpResponse>>(
      '/auth/verify-otp',
      data,
    );
    return response.data.data;
  },

  async validateEmail(data: ValidateEmailRequest): Promise<ValidateEmailResponse> {
    const response = await client.post<ApiResponse<ValidateEmailResponse>>(
      '/auth/validate-email',
      data,
    );
    return response.data.data;
  },
};
