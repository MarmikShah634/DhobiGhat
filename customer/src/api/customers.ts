import { apiClient } from './client';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  selected_washerman_id?: string;
  created_at: string;
}

export const customersApi = {
  register: (data: { name: string; address?: string; temp_token: string }) =>
    apiClient.post<Customer>('/customers/register', data),

  getProfile: () => apiClient.get<Customer>('/customers/me/profile'),

  updateProfile: (data: { name?: string; address?: string }) =>
    apiClient.patch<Customer>('/customers/me/profile', data),

  selectWasherman: (washerman_id: string) =>
    apiClient.post('/customers/me/washerman', { washerman_id }),

  getFavourites: () => apiClient.get('/customers/me/favourites'),

  addFavourite: (washermanId: string) =>
    apiClient.post(`/customers/me/favourites/${washermanId}`),

  removeFavourite: (washermanId: string) =>
    apiClient.delete(`/customers/me/favourites/${washermanId}`),

  deleteAccount: () => apiClient.delete('/customers/me/account'),
};
