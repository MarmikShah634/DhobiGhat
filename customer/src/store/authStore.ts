import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Customer } from '../api/customers';

interface AuthState {
  customer: Customer | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setTokens: (access: string, refresh: string) => Promise<void>;
  setCustomer: (customer: Customer) => void;
  logout: () => Promise<void>;
  loadTokens: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  customer: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setTokens: async (access, refresh) => {
    await SecureStore.setItemAsync('access_token', access);
    await SecureStore.setItemAsync('refresh_token', refresh);
    set({ accessToken: access, refreshToken: refresh, isAuthenticated: true });
  },

  setCustomer: (customer) => set({ customer }),

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    set({ customer: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },

  loadTokens: async () => {
    const access = await SecureStore.getItemAsync('access_token');
    const refresh = await SecureStore.getItemAsync('refresh_token');
    if (access && refresh) {
      set({ accessToken: access, refreshToken: refresh, isAuthenticated: true, isLoading: false });
      return true;
    }
    set({ isLoading: false });
    return false;
  },
}));
