import { api, unwrap, unwrapList } from '@/lib/api-client';

export const adminRidersApi = {
  list: (params) => api.get('/admin/riders', { params }).then(unwrapList),
  get: (id) => api.get(`/admin/riders/${id}`).then(unwrap),
  decide: ({ id, action, reason }) =>
    api.post(`/admin/riders/${id}/${action}`, reason ? { reason } : {}).then(unwrap),
};
