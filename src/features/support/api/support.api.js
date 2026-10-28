import { api, unwrap, unwrapList } from '@/lib/api-client';

export const supportApi = {
  adminTickets: (params) => api.get('/admin/tickets', { params }).then(unwrapList),
  adminTicket: (id) => api.get(`/admin/tickets/${id}`).then(unwrap),
  updateTicket: ({ id, ...body }) => api.patch(`/admin/tickets/${id}`, body).then(unwrap),
  replyAsAdmin: ({ id, body, internal }) =>
    api.post(`/admin/tickets/${id}/messages`, { body, internal }).then(unwrap),
  agents: () => api.get('/admin/agents').then(unwrap),
};
