import { apiClient } from './client';

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'collecting'
  | 'collected'
  | 'in_progress'
  | 'ready'
  | 'delivered'
  | 'cancelled'
  | 'declined';

export interface OrderItem {
  id: string;
  price_grid_id: string;
  item_name: string;
  wash_type_name: string;
  quantity: number;
  unit_price_paise: number;
  subtotal_paise: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  washerman_id: string;
  status: OrderStatus;
  delivery_mode: 'door_to_door' | 'drop_off';
  pickup_date: string;
  notes?: string;
  total_paise: number;
  is_paid: boolean;
  paid_at?: string;
  decline_reason?: string;
  washerman_collected_confirmed: boolean;
  customer_collected_confirmed: boolean;
  created_at: string;
  updated_at: string;
  washerman?: { name: string; business_name: string; area: string };
  items?: OrderItem[];
}

export interface CreateOrderPayload {
  washerman_id: string;
  delivery_mode: 'door_to_door' | 'drop_off';
  pickup_date: string;
  notes?: string;
  items: Array<{ price_grid_id: string; quantity: number }>;
}

export const ordersApi = {
  list: (params?: { status?: string; page?: number; limit?: number }) =>
    apiClient.get<{ data: Order[]; total: number; page: number; limit: number }>('/orders', {
      params,
    }),

  get: (id: string) => apiClient.get<Order>(`/orders/${id}`),

  create: (data: CreateOrderPayload) => apiClient.post<Order>('/orders', data),

  cancel: (id: string) => apiClient.post<Order>(`/orders/${id}/cancel`),

  confirmCollection: (id: string) =>
    apiClient.post<Order>(`/orders/${id}/confirm-collection`),
};
