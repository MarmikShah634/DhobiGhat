import { api } from './client';

export interface Washerman { id: string; name: string; phone: string; business_name?: string; area?: string; address?: string; unique_code: string; is_available: boolean; average_rating?: number; }

export const washermenApi = {
  register: (data: { phone: string; name: string; business_name: string; area: string; address?: string; temp_token: string }) => api.post<{ access_token: string; refresh_token: string; washerman: Washerman }>('/washermen/register', data),
  getProfile: () => api.get<Washerman>('/washermen/me'),
  updateProfile: (data: Partial<{ name: string; business_name: string; area: string; address: string; is_available: boolean }>) => api.patch<Washerman>('/washermen/me', data),
};
