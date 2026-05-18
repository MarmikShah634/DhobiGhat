import { apiClient } from './client';

export interface WashType { id: string; name: string; }
export interface PriceItem { id: string; item_name: string; }
export interface PriceGridEntry {
  id: string; price_item_id: string; wash_type_id: string;
  price_paise: number; item_name: string; wash_type_name: string;
}

export const pricingApi = {
  listWashTypes: () => apiClient.get<WashType[]>('/pricing/wash-types'),
  createWashType: (name: string) => apiClient.post<WashType>('/pricing/wash-types', { name }),
  deleteWashType: (id: string) => apiClient.delete(`/pricing/wash-types/${id}`),
  listItems: () => apiClient.get<PriceItem[]>('/pricing/items'),
  createItem: (item_name: string) => apiClient.post<PriceItem>('/pricing/items', { item_name }),
  deleteItem: (id: string) => apiClient.delete(`/pricing/items/${id}`),
  getGrid: () => apiClient.get<{ wash_types: WashType[]; items: PriceItem[]; grid: PriceGridEntry[] }>('/pricing/grid'),
  upsertGrid: (entries: Array<{ price_item_id: string; wash_type_id: string; price_paise: number }>) =>
    apiClient.put('/pricing/grid', { entries }),
};
