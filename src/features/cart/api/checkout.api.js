import { api, unwrap } from '@/lib/api-client';

export const checkoutApi = {
  quote: (body) => api.post('/checkout/quote', body).then(unwrap),
};
