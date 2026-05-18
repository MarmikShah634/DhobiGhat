import { apiClient } from './client';

export interface AccountingSummary {
  period_start: string; period_end: string; total_orders: number;
  delivered_orders: number; total_revenue_paise: number;
  paid_revenue_paise: number; unpaid_revenue_paise: number; avg_order_value_paise: number;
}

export const accountingApi = {
  getSummary: (params: { start_date: string; end_date: string }) =>
    apiClient.get<AccountingSummary>('/accounting/summary', { params }),
  downloadReceipt: (orderId: string) =>
    apiClient.get<ArrayBuffer>(`/accounting/receipt/${orderId}`, { responseType: 'arraybuffer' }),
  downloadStatement: (params: { start_date: string; end_date: string }) =>
    apiClient.get<ArrayBuffer>('/accounting/statement', { params, responseType: 'arraybuffer' }),
};
