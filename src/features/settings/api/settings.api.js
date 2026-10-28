import { api, unwrap, unwrapList } from '@/lib/api-client';

export const settingsApi = {
  get: () => api.get('/admin/settings').then(unwrap),
  update: (body) => api.patch('/admin/settings', body).then(unwrap),
  adminUsers: (params) => api.get('/admin/users', { params }).then(unwrapList),
  addAdmin: (body) => api.post('/admin/users', body).then(unwrap),
  updateAdmin: ({ id, ...body }) => api.patch(`/admin/users/${id}`, body).then(unwrap),
  roles: () => api.get('/admin/roles').then(unwrap),
  updateRole: ({ id, permissions }) =>
    api.patch(`/admin/roles/${id}`, { permissions }).then(unwrap),
  resetRole: (id) => api.post(`/admin/roles/${id}/reset`).then(unwrap),
  auditLog: (params) => api.get('/admin/audit-log', { params }).then(unwrapList),
};
