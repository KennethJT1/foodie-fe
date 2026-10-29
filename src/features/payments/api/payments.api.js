import { api, unwrap, unwrapList } from '@/lib/api-client';

export const paymentsApi = {
  initialize: (body) => api.post('/payments/initialize', body).then(unwrap),
  verify: (reference) => api.post('/payments/verify', { reference }).then(unwrap),
  history: (params) => api.get('/me/payments', { params }).then(unwrapList),
  /** Admin: every transaction; `meta.summary` totals the filtered range. */
  adminList: (params) =>
    api.get('/admin/payments', { params }).then((r) => ({ data: r.data.data, meta: r.data.meta })),
  reconcile: ({ id, note }) => api.post(`/admin/payments/${id}/reconcile`, { note }).then(unwrap),
};
