import { api } from './client';

export const authApi = {
  requestOtp: (phone: string) => api.post('/auth/otp/request', { phone, role: 'customer' }),
  verifyOtp: (phone: string, otp: string) => api.post('/auth/otp/verify', { phone, otp, role: 'customer' }),
  refreshToken: (refresh_token: string) => api.post('/auth/refresh', { refresh_token }),
  logout: () => api.post('/auth/logout'),
};
