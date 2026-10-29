import { api, unwrap, unwrapList } from '@/lib/api-client';

export const adminRidersApi = {
  list: (params) => api.get('/admin/riders', { params }).then(unwrapList),
  get: (id) => api.get(`/admin/riders/${id}`).then(unwrap),
  decide: ({ id, action, reason }) =>
    api.post(`/admin/riders/${id}/${action}`, reason ? { reason } : {}).then(unwrap),
  payouts: (params) => api.get('/admin/payouts', { params }).then(unwrapList),
  approvePayout: (id) => api.post(`/admin/payouts/${id}/approve`).then(unwrap),
  markPayoutPaid: ({ id, reference }) =>
    api.post(`/admin/payouts/${id}/mark-paid`, { reference }).then(unwrap),
};
