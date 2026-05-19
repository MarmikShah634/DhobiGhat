import { create } from 'zustand';
import type { Washerman } from '../api/washermen';

interface AuthState {
  washerman: Washerman | null;
  isAuthenticated: boolean;
  setWasherman: (w: Washerman) => void;
  setTokens: (access: string, refresh: string) => void;
  logout: () => void;
  loadTokens: () => boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  washerman: null,
  isAuthenticated: false,
  setWasherman: (washerman) => set({ washerman }),
  setTokens: (access, refresh) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    set({ isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ washerman: null, isAuthenticated: false });
  },
  loadTokens: () => {
    const token = localStorage.getItem('access_token');
    if (token) { set({ isAuthenticated: true }); return true; }
    return false;
  },
}));
