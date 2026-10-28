import { api, unwrap, unwrapList } from '@/lib/api-client';

export const paymentsApi = {
  initialize: (body) => api.post('/payments/initialize', body).then(unwrap),
  verify: (reference) => api.post('/payments/verify', { reference }).then(unwrap),
  history: (params) => api.get('/me/payments', { params }).then(unwrapList),
};
