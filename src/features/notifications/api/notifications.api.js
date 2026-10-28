import { api, unwrap, unwrapList } from '@/lib/api-client';

export const notificationsApi = {
  list: (params) => api.get('/notifications', { params }).then(unwrapList),
  unreadCount: () => api.get('/notifications/unread-count').then(unwrap),
  markRead: (id) => api.post(`/notifications/${id}/read`).then(unwrap),
  markAllRead: () => api.post('/notifications/read-all').then(unwrap),
};
