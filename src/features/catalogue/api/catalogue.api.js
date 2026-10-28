import { api, unwrap, unwrapList } from '@/lib/api-client';

export const catalogueApi = {
  categories: (params) => api.get('/categories', { params }).then(unwrapList),
  list: (params) => api.get('/food-items', { params }).then(unwrapList),
  get: (id) => api.get(`/food-items/${id}`).then(unwrap),
};
