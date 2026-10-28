import { setupWorker } from 'msw/browser';

import { registerMockSocket } from '@/lib/socket';

import { resetDb } from './db';
import { handlers } from './handlers';
import { registerRealtime } from './realtime';
import { createMockSocket } from './socket';

export const worker = setupWorker(...handlers);

/** Starts the mock API. Only called when VITE_USE_MOCKS=true. */
export async function startMocks() {
  registerMockSocket(createMockSocket);
  registerRealtime();
  window.__kjtMocks = { resetDb: () => (resetDb(), window.location.reload()) };
  await worker.start({
    onUnhandledRequest: ({ url }, print) => {
      if (new URL(url).pathname.startsWith('/api/')) print.warning();
    },
    quiet: true,
  });
}
