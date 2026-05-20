import { api } from './client';

export type OrderStatus = 'pending' | 'accepted' | 'collecting' | 'collected' | 'in_progress' | 'ready' | 'delivered' | 'cancelled' | 'declined';

export interface OrderItem { id: string; item_name: string; wash_type_name: string; quantity: number; unit_price_paise: number; subtotal_paise: number; }
export interface Order { id: string; order_number: string; status: OrderStatus; delivery_mode: 'door_to_door' | 'drop_off'; pickup_date: string; total_paise: number; is_paid: boolean; customer?: { id: string; name: string; phone?: string; address?: string; }; items?: OrderItem[]; created_at: string; updated_at?: string; }

export const ordersApi = {
  list: (params?: { status?: string; limit?: number; customer_id?: string }) => api.get<{ data: Order[]; total: number }>('/orders', { params }),
  get: (id: string) => api.get<Order>(`/orders/${id}`),
  accept: (id: string) => api.patch<Order>(`/orders/${id}/accept`),
  decline: (id: string, reason?: string) => api.patch<Order>(`/orders/${id}/decline`, { reason }),
  startCollecting: (id: string) => api.patch<Order>(`/orders/${id}/start-collecting`),
  markInProgress: (id: string) => api.patch<Order>(`/orders/${id}/mark-in-progress`),
  markReady: (id: string) => api.patch<Order>(`/orders/${id}/mark-ready`),
  markDelivered: (id: string) => api.patch<Order>(`/orders/${id}/mark-delivered`),
  markPaid: (id: string) => api.patch<Order>(`/orders/${id}/mark-paid`),
};
