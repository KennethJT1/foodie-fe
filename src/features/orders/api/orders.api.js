import { api, unwrap, unwrapList } from '@/lib/api-client';

export const ordersApi = {
  list: (params) => api.get('/orders', { params }).then(unwrapList),
  get: (id) => api.get(`/orders/${id}`).then(unwrap),
  cancel: ({ id, reason }) => api.post(`/orders/${id}/cancel`, { reason }).then(unwrap),
};
