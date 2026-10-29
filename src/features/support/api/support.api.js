import { api, unwrap, unwrapList } from '@/lib/api-client';

export const supportApi = {
  myTickets: (params) => api.get('/support/tickets', { params }).then(unwrapList),
  myTicket: (id) => api.get(`/support/tickets/${id}`).then(unwrap),
  openTicket: (body) => api.post('/support/tickets', body).then(unwrap),
  replyToTicket: ({ id, body }) =>
    api.post(`/support/tickets/${id}/messages`, { body }).then(unwrap),
  resolveTicket: (id) => api.post(`/support/tickets/${id}/resolve`).then(unwrap),
  adminTickets: (params) => api.get('/admin/tickets', { params }).then(unwrapList),
  adminTicket: (id) => api.get(`/admin/tickets/${id}`).then(unwrap),
  updateTicket: ({ id, ...body }) => api.patch(`/admin/tickets/${id}`, body).then(unwrap),
  replyAsAdmin: ({ id, body, internal }) =>
    api.post(`/admin/tickets/${id}/messages`, { body, internal }).then(unwrap),
  agents: () => api.get('/admin/agents').then(unwrap),
};
