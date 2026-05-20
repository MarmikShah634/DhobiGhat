import { api } from './client';

export interface Washerman { id: string; name: string; phone: string; business_name?: string; area?: string; address?: string; unique_code: string; is_available: boolean; average_rating?: number; review_count?: number; }

export const washermenApi = {
  search: (params?: { query?: string; available_only?: boolean; page?: number; limit?: number }) => api.get<{ data: Washerman[]; total: number; page: number }>('/washermen', { params }),
  getById: (id: string) => api.get<Washerman>(`/washermen/${id}`),
};
