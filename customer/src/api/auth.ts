import { apiClient } from './client';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface OtpRequestResponse {
  message: string;
  temp_token?: string;
}

export interface OtpVerifyResponse extends AuthTokens {
  role: string;
  is_new_user: boolean;
  temp_token?: string;
}

export const authApi = {
  requestOtp: (phone: string) =>
    apiClient.post<OtpRequestResponse>('/auth/otp/request', { phone, role: 'customer' }),

  verifyOtp: (phone: string, otp: string) =>
    apiClient.post<OtpVerifyResponse>('/auth/otp/verify', { phone, otp, role: 'customer' }),

  refreshToken: (refresh_token: string) =>
    apiClient.post<AuthTokens>('/auth/refresh', { refresh_token }),

  logout: (refresh_token: string) =>
    apiClient.post('/auth/logout', { refresh_token }),
};
