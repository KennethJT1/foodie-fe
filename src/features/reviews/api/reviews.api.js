import { api, unwrap, unwrapList } from '@/lib/api-client';

export const reviewsApi = {
  list: (params) => api.get('/reviews', { params }).then(unwrapList),
  rateOrder: ({ orderId, ...body }) => api.post(`/orders/${orderId}/reviews`, body).then(unwrap),
};
