import { api, unwrap } from '@/lib/api-client';

export const liveMapApi = {
  snapshot: () => api.get('/admin/live-map').then(unwrap),
};
