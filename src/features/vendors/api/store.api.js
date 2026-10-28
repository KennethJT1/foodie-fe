import { api, unwrap } from '@/lib/api-client';

export const storeApi = {
  get: () => api.get('/vendor/store').then(unwrap),
  update: (body) => api.patch('/vendor/store', body).then(unwrap),
  requestBankChange: (body) => api.post('/vendor/bank-change', body).then(unwrap),
  staff: () => api.get('/vendor/staff').then(unwrap),
  addStaff: (body) => api.post('/vendor/staff', body).then(unwrap),
  removeStaff: (id) => api.delete(`/vendor/staff/${id}`),
};
