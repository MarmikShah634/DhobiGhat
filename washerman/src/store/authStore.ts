import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Washerman } from '../api/washermen';

interface AuthState {
  washerman: Washerman | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setTokens: (access: string, refresh: string) => Promise<void>;
  setWasherman: (w: Washerman) => void;
  logout: () => Promise<void>;
  loadTokens: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  washerman: null, accessToken: null, isAuthenticated: false, isLoading: true,

  setTokens: async (access, refresh) => {
    await SecureStore.setItemAsync('access_token', access);
    await SecureStore.setItemAsync('refresh_token', refresh);
    set({ accessToken: access, isAuthenticated: true });
  },

  setWasherman: (washerman) => set({ washerman }),

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    set({ washerman: null, accessToken: null, isAuthenticated: false });
  },

  loadTokens: async () => {
    const access = await SecureStore.getItemAsync('access_token');
    const refresh = await SecureStore.getItemAsync('refresh_token');
    if (access && refresh) {
      set({ accessToken: access, isAuthenticated: true, isLoading: false });
      return true;
    }
    set({ isLoading: false });
    return false;
  },
}));
