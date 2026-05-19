import { api } from './client';
export interface Notification { id: string; title: string; body: string; is_read: boolean; order_id?: string; created_at: string; }
export const notificationsApi = {
  list: () => api.get<{ data: Notification[] }>('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};
