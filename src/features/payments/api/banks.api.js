import { api, unwrap } from '@/lib/api-client';

export const banksApi = {
  list: () => api.get('/banks').then(unwrap),
  resolve: (body) => api.post('/banks/resolve', body).then(unwrap),
};
