import { api, unwrap, unwrapList } from '@/lib/api-client';

export const adminVendorsApi = {
  list: (params) => api.get('/admin/vendors', { params }).then(unwrapList),
  get: (id) => api.get(`/admin/vendors/${id}`).then(unwrap),
  decide: ({ id, action, reason }) =>
    api.post(`/admin/vendors/${id}/${action}`, reason ? { reason } : {}).then(unwrap),
  bankChange: ({ id, decision }) =>
    api.post(`/admin/vendors/${id}/bank-change/${decision}`).then(unwrap),
};
