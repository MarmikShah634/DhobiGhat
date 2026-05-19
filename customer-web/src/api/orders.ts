import { api } from './client';

export type OrderStatus = 'pending' | 'accepted' | 'collecting' | 'collected' | 'in_progress' | 'ready' | 'delivered' | 'cancelled' | 'declined';

export interface OrderItem { id: string; item_name: string; wash_type_name: string; quantity: number; unit_price_paise: number; subtotal_paise: number; }

export interface Order { id: string; order_number: string; status: OrderStatus; delivery_mode: 'door_to_door' | 'drop_off'; pickup_date: string; total_paise: number; is_paid: boolean; washerman?: { id: string; name: string; business_name?: string; phone?: string; }; items?: OrderItem[]; created_at: string; updated_at?: string; }

export interface CreateOrderPayload { washerman_id: string; delivery_mode: 'door_to_door' | 'drop_off'; pickup_date: string; items: { item_id: string; wash_type_id: string; quantity: number }[]; }

export const ordersApi = {
  list: (params?: { status?: string; limit?: number }) => api.get<{ data: Order[]; total: number }>('/orders', { params }),
  get: (id: string) => api.get<Order>(`/orders/${id}`),
  create: (data: CreateOrderPayload) => api.post<Order>('/orders', data),
  cancel: (id: string) => api.patch<Order>(`/orders/${id}/cancel`),
  confirmCollection: (id: string) => api.patch<Order>(`/orders/${id}/confirm-collection`),
};
