import { api, unwrap } from '@/lib/api-client';

/** The vendor's own menu (includes sold-out items). `meta.limits` carries the plan limits. */
export const menuApi = {
  list: (params) =>
    api.get('/vendor/menu', { params }).then((r) => ({ data: r.data.data, meta: r.data.meta })),
  get: (id) => api.get(`/vendor/menu/${id}`).then(unwrap),
  create: (body) => api.post('/vendor/menu', body).then(unwrap),
  update: ({ id, ...body }) => api.patch(`/vendor/menu/${id}`, body).then(unwrap),
  remove: (id) => api.delete(`/vendor/menu/${id}`),
};
