import { api } from './client';

export interface Review { id: string; rating: number; comment?: string; customer_name?: string; created_at: string; }

export const reviewsApi = {
  getForWasherman: (washermanId: string) => api.get<Review[]>(`/reviews/washerman/${washermanId}`),
  submit: (data: { washerman_id: string; order_id: string; rating: number; comment?: string }) => api.post<Review>('/reviews', data),
};
