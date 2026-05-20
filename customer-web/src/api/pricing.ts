import { api } from './client';

export interface WashType { id: string; name: string; }
export interface PricingItem { id: string; name: string; }
export interface GridEntry { wash_type_id: string; item_id: string; price_paise: number; }
export interface PricingGrid { wash_types: WashType[]; items: PricingItem[]; grid: GridEntry[]; }

export const pricingApi = {
  getGrid: (washermanId: string) => api.get<PricingGrid>(`/pricing/grid/${washermanId}`),
};
