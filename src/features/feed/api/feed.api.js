import { api, unwrap, unwrapList } from '@/lib/api-client';

export const feedApi = {
  feed: (params) => api.get('/feed', { params }).then(unwrapList),
  like: (id) => api.post(`/food-items/${id}/likes`).then(unwrap),
  unlike: (id) => api.delete(`/food-items/${id}/likes`).then(unwrap),
  liked: (params) => api.get('/me/likes', { params }).then(unwrapList),
  comments: (foodItemId, params) =>
    api.get(`/food-items/${foodItemId}/comments`, { params }).then(unwrapList),
  addComment: ({ foodItemId, body, parentId }) =>
    api.post(`/food-items/${foodItemId}/comments`, { body, parentId }).then(unwrap),
  editComment: ({ id, body }) => api.patch(`/comments/${id}`, { body }).then(unwrap),
  deleteComment: (id) => api.delete(`/comments/${id}`).then(unwrap),
  /** Comments on the signed-in vendor's dishes (`answered=false` = waiting for a reply). */
  vendorComments: (params) => api.get('/vendor/comments', { params }).then(unwrapList),
  adminReports: (params) => api.get('/admin/reports', { params }).then(unwrapList),
  resolveReport: ({ id, action }) =>
    api.post(`/admin/reports/${id}/resolve`, { action }).then(unwrap),
  report: (body) => api.post('/reports', body).then(unwrap),
};
