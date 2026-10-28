import { api, unwrap } from '@/lib/api-client';

export const chatApi = {
  get: (orderId) => api.get(`/orders/${orderId}/chat`).then(unwrap),
  send: ({ orderId, body }) => api.post(`/orders/${orderId}/chat`, { body }).then(unwrap),
};
