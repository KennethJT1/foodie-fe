import { api, unwrap } from '@/lib/api-client';

export const authApi = {
  register: (body) => api.post('/auth/register', body).then(unwrap),
  requestOtp: (body) => api.post('/auth/otp/request', body).then(unwrap),
  verifyOtp: (body) => api.post('/auth/otp/verify', body).then(unwrap),
  login: (body) => api.post('/auth/login', body).then(unwrap),
  google: (body) => api.post('/auth/google', body).then(unwrap),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (body) => api.post('/auth/password/forgot', body).then(unwrap),
  resetPassword: (body) => api.post('/auth/password/reset', body).then(unwrap),
  me: () => api.get('/me').then(unwrap),
  updateMe: (body) => api.patch('/me', body).then(unwrap),
  deleteMe: () => api.delete('/me'),
};
