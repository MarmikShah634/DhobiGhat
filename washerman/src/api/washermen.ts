import { apiClient } from './client';

export interface Washerman {
  id: string; name: string; business_name: string; area: string;
  address?: string; phone: string; unique_code: string;
  is_available: boolean; avg_rating: number; review_count: number;
}

export const washermenApi = {
  register: (data: { phone: string; name: string; business_name: string; area: string; address?: string; temp_token: string }) =>
    apiClient.post<Washerman>('/washermen/register', data),
  getProfile: () => apiClient.get<Washerman>('/washermen/me/profile'),
  updateProfile: (data: Partial<Pick<Washerman, 'name' | 'business_name' | 'area' | 'address' | 'is_available'>>) =>
    apiClient.patch<Washerman>('/washermen/me/profile', data),
};
