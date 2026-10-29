import { api, unwrap } from '@/lib/api-client';

const withMeta = (r) => ({ data: r.data.data, meta: r.data.meta });

export const reportsApi = {
  vendorStats: (params) => api.get('/vendor/stats', { params }).then(unwrap),
  /** `meta.summary` = { settling, settled, refunded } over the whole filtered range. */
  vendorSales: (params) => api.get('/vendor/sales', { params }).then(withMeta),
  vendorSalesDaily: (params) => api.get('/vendor/sales/daily', { params }).then(unwrap),
  vendorEngagement: () => api.get('/vendor/engagement').then(unwrap),
  adminOverview: (params) => api.get('/admin/overview', { params }).then(unwrap),
  customers: (params) => api.get('/admin/customers', { params }).then(withMeta),
  setCustomerStatus: ({ id, status, reason }) =>
    api.post(`/admin/customers/${id}/status`, { status, reason }).then(unwrap),
};
