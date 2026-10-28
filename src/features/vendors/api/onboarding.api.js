import { api, unwrap } from '@/lib/api-client';

export const onboardingApi = {
  get: () => api.get('/vendor/onboarding').then(unwrap),
  /** Saves one wizard step: { step, ...fields }. */
  saveStep: (body) => api.patch('/vendor/onboarding', body).then(unwrap),
  submit: () => api.post('/vendor/onboarding/submit').then(unwrap),
  uploadDocument: (body) => api.post('/vendor/documents', body).then(unwrap),
  removeDocument: (id) => api.delete(`/vendor/documents/${id}`),
};

export const banksApi = {
  list: () => api.get('/banks').then(unwrap),
  resolve: (body) => api.post('/banks/resolve', body).then(unwrap),
};
