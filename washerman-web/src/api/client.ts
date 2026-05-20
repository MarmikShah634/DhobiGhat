import axios, { type InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;
if (!BASE_URL) throw new Error('VITE_API_URL is not set. Create a .env file with VITE_API_URL=<your-backend-url>');

export const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

let isRefreshing = false;
let queue: Array<(token: string) => void> = [];

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token');
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
        const rt = localStorage.getItem('refresh_token');
        if (!rt) throw new Error('no refresh token');
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: rt });
        const newToken = res.data.access_token;
        localStorage.setItem('access_token', newToken);
        if (res.data.refresh_token) localStorage.setItem('refresh_token', res.data.refresh_token);
        queue.forEach((cb) => cb(newToken));
        queue = [];
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/auth/phone';
        return Promise.reject(err);
      } finally { isRefreshing = false; }
    }
    return Promise.reject(err);
  }
);
