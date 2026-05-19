import { api } from './client';

export interface Customer { id: string; name: string; phone: string; address?: string; washerman_id?: string; washerman?: { id: string; name: string; business_name?: string; area?: string; unique_code: string; }; }

export const customersApi = {
  register: (data: { phone: string; name: string; address?: string; temp_token: string }) => api.post<Customer>('/customers/register', data),
  getProfile: () => api.get<Customer>('/customers/me'),
  updateProfile: (data: Partial<{ name: string; address: string }>) => api.patch<Customer>('/customers/me', data),
  selectWasherman: (washerman_id: string) => api.post<Customer>('/customers/me/washerman', { washerman_id }),
  getFavourites: () => api.get<{ id: string; washerman: { id: string; name: string; business_name?: string; area?: string; average_rating?: number; } }[]>('/customers/me/favourites'),
  addFavourite: (washerman_id: string) => api.post('/customers/me/favourites', { washerman_id }),
  removeFavourite: (washerman_id: string) => api.delete(`/customers/me/favourites/${washerman_id}`),
};
