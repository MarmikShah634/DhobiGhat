import { apiClient } from './client';

export interface WashType {
  id: string;
  name: string;
}

export interface PriceItem {
  id: string;
  item_name: string;
}

export interface PriceGridEntry {
  id: string;
  price_item_id: string;
  wash_type_id: string;
  price_paise: number;
  item_name: string;
  wash_type_name: string;
}

export const pricingApi = {
  getGrid: (washermanId: string) =>
    apiClient.get<{ wash_types: WashType[]; items: PriceItem[]; grid: PriceGridEntry[] }>(
      `/pricing/grid/${washermanId}`,
    ),
};
