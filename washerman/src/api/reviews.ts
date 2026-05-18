import { apiClient } from './client';

export interface Review {
  id: string; order_id: string; customer_id: string; washerman_id: string;
  rating: number; review_text?: string; created_at: string;
}

export const reviewsApi = {
  getMyReviews: (params?: { page?: number; limit?: number }) =>
    apiClient.get<{ data: Review[]; total: number; avg_rating: number }>('/reviews/washerman/me', { params }),
};
