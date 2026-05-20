import { apiClient } from './client';

export type OrderStatus = 'pending' | 'accepted' | 'collecting' | 'collected' | 'in_progress' | 'ready' | 'delivered' | 'cancelled' | 'declined';

export interface OrderItem {
  id: string; item_name: string; wash_type_name: string;
  quantity: number; unit_price_paise: number; subtotal_paise: number;
}

export interface Order {
  id: string; order_number: string; customer_id: string; washerman_id: string;
  status: OrderStatus; delivery_mode: 'door_to_door' | 'drop_off';
  pickup_date: string; notes?: string; total_paise: number;
  is_paid: boolean; paid_at?: string; decline_reason?: string;
  washerman_collected_confirmed: boolean; customer_collected_confirmed: boolean;
  created_at: string; updated_at: string;
  customer?: { name: string; address?: string; phone: string };
  items?: OrderItem[];
}

export const ordersApi = {
  list: (params?: { status?: string; page?: number; limit?: number }) =>
    apiClient.get<{ data: Order[]; total: number; page: number; limit: number }>('/orders', { params }),
  get: (id: string) => apiClient.get<Order>(`/orders/${id}`),
  accept: (id: string) => apiClient.post<Order>(`/orders/${id}/accept`),
  decline: (id: string, reason?: string) =>
    apiClient.post<Order>(`/orders/${id}/decline`, { reason }),
  startCollecting: (id: string) => apiClient.post<Order>(`/orders/${id}/start-collecting`),
  markInProgress: (id: string) => apiClient.post<Order>(`/orders/${id}/in-progress`),
  markReady: (id: string) => apiClient.post<Order>(`/orders/${id}/ready`),
  markDelivered: (id: string) => apiClient.post<Order>(`/orders/${id}/deliver`),
  markPaid: (id: string) => apiClient.post<Order>(`/orders/${id}/pay`),
};
