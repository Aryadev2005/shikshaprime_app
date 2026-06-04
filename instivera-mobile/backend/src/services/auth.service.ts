import { identityClient } from './clients';
import logger from '../utils/logger';
import {
  MobileLoginResponse,
  MobileUser,
  IdentityLoginResponse,
  IdentitySendOtpResponse,
  IdentityVerifyOtpResponse,
  IdentityValidateEmailResponse,
} from '../types/auth.types';
import { ApiError } from '../utils/api-error';

export class AuthService {
  private generateAvatarInitials(firstName: string, lastName: string): string {
    const first = firstName?.charAt(0).toUpperCase() || '';
    const last = lastName?.charAt(0).toUpperCase() || '';
    return `${first}${last}`;
  }

  async login(
    username: string,
    password: string,
    tenant: string,
  ): Promise<MobileLoginResponse> {
    try {
      logger.debug(
        { username, tenant },
        '[AuthService] Attempting user login',
      );

      const response = await identityClient.request(
        undefined,
        tenant,
        {
          method: 'POST',
          url: '/authenticate-user',
          data: { username, password },
        },
      );

      const identityData = response.data as IdentityLoginResponse;

      if (identityData.status !== 1) {
        throw new ApiError(401, 'Invalid credentials');
      }

      const user: MobileUser = {
        id: identityData.data.user_id,
        name: `${identityData.data.first_name} ${identityData.data.last_name}`,
        firstName: identityData.data.first_name,
        lastName: identityData.data.last_name,
        role: identityData.data.role,
        email: identityData.data.email,
        userCode: identityData.data.user_code,
        avatarInitials: this.generateAvatarInitials(
          identityData.data.first_name,
          identityData.data.last_name,
        ),
      };

      logger.debug(
        { userId: user.id, email: user.email, tenant },
        '[AuthService] Login successful',
      );

      return {
        user,
        token: identityData.token,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error(
        { error, username, tenant },
        '[AuthService] Login error',
      );
      throw new ApiError(500, 'Authentication failed');
    }
  }

  async sendOtp(email: string, tenant: string): Promise<any> {
    try {
      logger.debug({ email, tenant }, '[AuthService] Sending OTP');

      const response = await identityClient.request(
        undefined,
        tenant,
        {
          method: 'POST',
          url: '/send-email-otp',
          data: { email },
        },
      );

      const identityData = response.data as IdentitySendOtpResponse;

      if (identityData.status !== 1) {
        throw new ApiError(400, identityData.message);
      }

      logger.debug({ email, tenant }, '[AuthService] OTP sent successfully');

      return identityData;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error({ error, email, tenant }, '[AuthService] Send OTP error');
      throw new ApiError(500, 'Failed to send OTP');
    }
  }

  async verifyOtp(
    email: string,
    otp: string,
    tenant: string,
  ): Promise<MobileLoginResponse> {
    try {
      logger.debug(
        { email, tenant },
        '[AuthService] Verifying OTP',
      );

      const response = await identityClient.request(
        undefined,
        tenant,
        {
          method: 'POST',
          url: '/verify-email-otp',
          data: { email, otp },
        },
      );

      const identityData = response.data as IdentityVerifyOtpResponse;

      if (identityData.status !== 1) {
        throw new ApiError(400, 'Invalid OTP');
      }

      // After verifying OTP, we need to get the user details
      // For now, we'll return a minimal response with just the token
      // In a real scenario, the identity service should return user data
      const user: MobileUser = {
        id: '',
        name: email,
        firstName: '',
        lastName: '',
        role: 'user',
        email,
        userCode: '',
        avatarInitials: '',
      };

      logger.debug({ email, tenant }, '[AuthService] OTP verified successfully');

      return {
        user,
        token: identityData.data.token,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error(
        { error, email, tenant },
        '[AuthService] Verify OTP error',
      );
      throw new ApiError(500, 'OTP verification failed');
    }
  }

  async validateEmail(email: string, tenant: string): Promise<any> {
    try {
      logger.debug({ email, tenant }, '[AuthService] Validating email');

      const response = await identityClient.request(
        undefined,
        tenant,
        {
          method: 'POST',
          url: '/validate-email',
          data: { email },
        },
      );

      const identityData = response.data as IdentityValidateEmailResponse;

      if (identityData.status !== 1) {
        throw new ApiError(400, identityData.message);
      }

      logger.debug(
        { email, exists: identityData.data.exists, tenant },
        '[AuthService] Email validation complete',
      );

      return identityData;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error(
        { error, email, tenant },
        '[AuthService] Validate email error',
      );
      throw new ApiError(500, 'Email validation failed');
    }
  }
}

export const authService = new AuthService();
