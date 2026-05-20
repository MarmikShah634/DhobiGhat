import { create } from 'zustand';
import type { Customer } from '../api/customers';

interface AuthState {
  customer: Customer | null;
  isAuthenticated: boolean;
  setCustomer: (c: Customer) => void;
  setTokens: (access: string, refresh: string) => void;
  logout: () => void;
  loadTokens: () => boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  customer: null,
  isAuthenticated: false,
  setCustomer: (customer) => set({ customer }),
  setTokens: (access, refresh) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    set({ isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ customer: null, isAuthenticated: false });
  },
  loadTokens: () => {
    const token = localStorage.getItem('access_token');
    if (token) { set({ isAuthenticated: true }); return true; }
    return false;
  },
}));
