import { apiClient } from './client';

export interface Notification {
  id: string; title: string; body: string; is_read: boolean;
  order_id?: string; sent_at: string;
}

export const notificationsApi = {
  list: (params?: { unread?: boolean; page?: number; limit?: number }) =>
    apiClient.get<{ data: Notification[]; total: number; page: number; limit: number }>('/notifications', { params }),
  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () => apiClient.patch('/notifications/read-all'),
};
