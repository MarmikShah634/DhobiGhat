import { api } from './client';
export interface Review { id: string; rating: number; comment?: string; customer_name?: string; created_at: string; }
export const reviewsApi = {
  getMyReviews: () => api.get<Review[]>('/reviews/washerman/me'),
};
