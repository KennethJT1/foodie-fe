import { env } from '@/lib/env';

/** Full mock URL for an API path, e.g. api('/orders/:id'). */
export const api = (path) => `${env.apiUrl.replace(/\/$/, '')}${path}`;
