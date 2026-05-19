import { api } from './client';

export const authApi = {
  requestOtp: (phone: string) => api.post('/auth/otp/request', { phone, role: 'washerman' }),
  verifyOtp: (phone: string, otp: string) => api.post('/auth/otp/verify', { phone, otp, role: 'washerman' }),
  refreshToken: (refresh_token: string) => api.post('/auth/refresh', { refresh_token }),
  logout: () => api.post('/auth/logout'),
};
