import { api, unwrap, unwrapList } from '@/lib/api-client';

export const refundsApi = {
  list: (params) => api.get('/refunds', { params }).then(unwrapList),
  get: (id) => api.get(`/refunds/${id}`).then(unwrap),
  create: (body) => api.post('/refunds', body).then(unwrap),
  confirm: (id) => api.post(`/refunds/${id}/confirm`).then(unwrap),
  dispute: ({ id, reason }) => api.post(`/refunds/${id}/dispute`, { reason }).then(unwrap),
};
