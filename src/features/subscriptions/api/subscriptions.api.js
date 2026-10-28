import { api, unwrap, unwrapList } from '@/lib/api-client';

export const subscriptionsApi = {
  /** `{ data: plans, meta: { trialDays, yearlyDiscountPct } }` */
  plans: () => api.get('/plans').then(unwrapList),
  mine: () => api.get('/vendor/subscription').then(unwrap),
  invoices: (params) => api.get('/vendor/subscription/invoices', { params }).then(unwrapList),
  startTrial: ({ planId }) => api.post('/vendor/subscription/trial', { planId }).then(unwrap),
  initialize: (body) => api.post('/vendor/subscription/initialize', body).then(unwrap),
  verify: (reference) => api.post('/vendor/subscription/verify', { reference }).then(unwrap),
  scheduleChange: (body) => api.post('/vendor/subscription/change', body).then(unwrap),
  cancel: () => api.post('/vendor/subscription/cancel').then(unwrap),
  resume: () => api.post('/vendor/subscription/resume').then(unwrap),
  // Admin
  adminPlans: () => api.get('/admin/plans').then(unwrapList),
  savePlan: ({ id, ...body }) =>
    (id ? api.patch(`/admin/plans/${id}`, body) : api.post('/admin/plans', body)).then(unwrap),
  adminList: (params) => api.get('/admin/subscriptions', { params }).then(unwrapList),
  extend: ({ id, days, reason }) =>
    api.post(`/admin/subscriptions/${id}/extend`, { days, reason }).then(unwrap),
};
