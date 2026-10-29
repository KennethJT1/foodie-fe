import { api, unwrap, unwrapList } from '@/lib/api-client';

export const vendorsApi = {
  list: (params) => api.get('/vendors', { params }).then(unwrapList),
  bySlug: (slug) => api.get(`/vendors/${slug}`).then(unwrap),
  follow: (id) => api.post(`/vendors/${id}/follow`).then(unwrap),
  unfollow: (id) => api.delete(`/vendors/${id}/follow`).then(unwrap),
  followed: (params) => api.get('/me/follows', { params }).then(unwrapList),
};
