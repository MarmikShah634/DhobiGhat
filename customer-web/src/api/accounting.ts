import { api } from './client';

export const accountingApi = {
  getSummary: (params?: { range?: string }) => api.get('/accounting/summary', { params }),
};
