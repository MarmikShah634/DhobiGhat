import axios, { type InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

let isRefreshing = false;
let queue: Array<(token: string) => void> = [];

function getToken(key: string) { return localStorage.getItem(key); }
function setToken(key: string, value: string) { localStorage.setItem(key, value); }
function clearTokens() { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); }

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (isRefreshing) {
        return new Promise((resolve) => {
          queue.push((token) => { original.headers.Authorization = `Bearer ${token}`; resolve(api(original)); });
        });
      }
      isRefreshing = true;
      try {
        const rt = getToken('refresh_token');
        if (!rt) throw new Error('no refresh token');
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: rt });
        const newToken = res.data.access_token;
        setToken('access_token', newToken);
        if (res.data.refresh_token) setToken('refresh_token', res.data.refresh_token);
        queue.forEach((cb) => cb(newToken));
        queue = [];
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        clearTokens();
        window.location.href = '/auth/phone';
        return Promise.reject(err);
      } finally { isRefreshing = false; }
    }
    return Promise.reject(err);
  }
);
