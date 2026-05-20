import { api } from './client';

export interface WashType { id: string; name: string; }
export interface PricingItem { id: string; name: string; }
export interface GridEntry { wash_type_id: string; item_id: string; price_paise: number; }

export const pricingApi = {
  listWashTypes: () => api.get<WashType[]>('/pricing/wash-types'),
  createWashType: (data: { name: string }) => api.post<WashType>('/pricing/wash-types', data),
  deleteWashType: (id: string) => api.delete(`/pricing/wash-types/${id}`),
  listItems: () => api.get<PricingItem[]>('/pricing/items'),
  createItem: (data: { name: string }) => api.post<PricingItem>('/pricing/items', data),
  deleteItem: (id: string) => api.delete(`/pricing/items/${id}`),
  getGrid: () => api.get<GridEntry[]>('/pricing/grid'),
  upsertGrid: (entries: GridEntry[]) => api.post('/pricing/grid', { entries }),
};
