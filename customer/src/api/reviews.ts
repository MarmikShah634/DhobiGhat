import { apiClient } from './client';

export interface Review {
  id: string;
  order_id: string;
  customer_id: string;
  washerman_id: string;
  rating: number;
  review_text?: string;
  created_at: string;
}

export const reviewsApi = {
  getForWasherman: (washermanId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<{ data: Review[]; total: number; page: number; limit: number }>(
      `/reviews/washerman/${washermanId}`,
      { params },
    ),

  submit: (data: { order_id: string; rating: number; review_text?: string }) =>
    apiClient.post<Review>('/reviews', data),
};
