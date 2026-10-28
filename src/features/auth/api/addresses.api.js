import { api, unwrap } from '@/lib/api-client';

export const addressesApi = {
  list: () => api.get('/addresses').then(unwrap),
  create: (body) => api.post('/addresses', body).then(unwrap),
  update: ({ id, ...body }) => api.patch(`/addresses/${id}`, body).then(unwrap),
  remove: (id) => api.delete(`/addresses/${id}`).then(unwrap),
  setDefault: (id) => api.post(`/addresses/${id}/default`).then(unwrap),
};
