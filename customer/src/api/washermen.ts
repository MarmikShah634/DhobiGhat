import { apiClient } from './client';

export interface Washerman {
  id: string;
  name: string;
  business_name: string;
  area: string;
  address?: string;
  phone: string;
  unique_code: string;
  is_available: boolean;
  avg_rating: number;
  review_count: number;
}

export interface WashermanSearchParams {
  area?: string;
  query?: string;
  available_only?: boolean;
  page?: number;
  limit?: number;
}

export const washermenApi = {
  search: (params: WashermanSearchParams) =>
    apiClient.get<{ data: Washerman[]; total: number; page: number; limit: number }>(
      '/washermen/search',
      { params },
    ),

  getById: (id: string) => apiClient.get<Washerman>(`/washermen/${id}`),
};
