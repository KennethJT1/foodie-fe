import { api, unwrap, unwrapList } from '@/lib/api-client';

export const ordersApi = {
  list: (params) => api.get('/orders', { params }).then(unwrapList),
  get: (id) => api.get(`/orders/${id}`).then(unwrap),
  cancel: ({ id, reason }) => api.post(`/orders/${id}/cancel`, { reason }).then(unwrap),
  // Vendor steps (BRD section 7)
  accept: (id) => api.post(`/orders/${id}/accept`).then(unwrap),
  reject: ({ id, reason }) => api.post(`/orders/${id}/reject`, { reason }).then(unwrap),
  markPreparing: (id) => api.post(`/orders/${id}/preparing`).then(unwrap),
  markReady: (id) => api.post(`/orders/${id}/ready`).then(unwrap),
  // Admin (Dispatch)
  reassign: ({ id, riderId }) => api.post(`/admin/orders/${id}/reassign`, { riderId }).then(unwrap),
};
