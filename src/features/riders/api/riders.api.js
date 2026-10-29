import { api, unwrap, unwrapList } from '@/lib/api-client';

export const ridersApi = {
  me: () => api.get('/rider/me').then(unwrap),
  setStatus: (body) => api.post('/rider/status', body).then(unwrap),
  offers: () => api.get('/rider/offers').then(unwrap),
  acceptOffer: (id) => api.post(`/deliveries/offers/${id}/accept`).then(unwrap),
  declineOffer: (id) => api.post(`/deliveries/offers/${id}/decline`).then(unwrap),
  activeDelivery: () => api.get('/rider/delivery').then(unwrap),
  pickup: (id) => api.post(`/deliveries/${id}/pickup`).then(unwrap),
  complete: ({ id, code }) => api.post(`/deliveries/${id}/complete`, { code }).then(unwrap),
  trips: (params) => api.get('/rider/trips', { params }).then(unwrapList),
  earnings: () => api.get('/rider/earnings').then(unwrap),
  statements: () => api.get('/rider/statements').then(unwrap),
  // Onboarding
  onboarding: () => api.get('/rider/onboarding').then(unwrap),
  saveStep: (body) => api.patch('/rider/onboarding', body).then(unwrap),
  submit: () => api.post('/rider/onboarding/submit').then(unwrap),
  uploadDocument: (body) => api.post('/rider/documents', body).then(unwrap),
  removeDocument: (id) => api.delete(`/rider/documents/${id}`),
};
