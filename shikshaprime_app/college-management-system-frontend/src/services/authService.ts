// Auth service integrating with Nginx API Gateway
import apiClient from "./apiClient";

// Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
    role: string; 
    first_name: string; 
    last_name: string; 
    email: string; 
    username: string; 
    user_id: string;
}

// Login
export async function loginUser(credentials: LoginCredentials) {
  const { data } = await apiClient.post("/identity/authenticate-user", credentials);
  return { user: data.data, token: data.token };
}

// Validate email exists in users
export async function validateUserEmail(email: string) {
  const { data } = await apiClient.post("/identity/validate-email", { email });
  return data;
}

// Change password
export async function changePassword(email: string, newPassword: string) {
  const { data } = await apiClient.post("/identity/change-password", { email, newPassword });
  return data;
}

// Send email OTP for password change
export async function sendEmailOtp(email: string) {
  const { data } = await apiClient.post("/identity/send-email-otp", { email });
  return data;
}

// Verify email OTP for password change
export async function verifyEmailOtp(email: string, otp: string) {
  const { data } = await apiClient.post("/identity/verify-email-otp", { email, otp });
  return data;
}
