import axios from 'axios';
import { setupWorker } from 'msw/browser';

import { api } from '@/lib/api-client';
import { registerMockSocket } from '@/lib/socket';

import { db, resetDb } from './db';
import { handlers } from './handlers';
import { configureOrderSimulation, registerRealtime } from './realtime';
import { createMockSocket } from './socket';

export const worker = setupWorker(...handlers);

/** Starts the mock API. Only called when VITE_USE_MOCKS=true. */
export async function startMocks() {
  registerMockSocket(createMockSocket);
  registerRealtime();
  window.__kjtMocks = {
    resetDb: () => (resetDb(), window.location.reload()),
    // For the Playwright journeys: speed up the fake real time and peek at the mock data
    configureSimulation: configureOrderSimulation,
    deliveryCode: (orderIdOrCode) =>
      db.orders.find((o) => o.id === orderIdOrCode || o.code === orderIdOrCode)?.deliveryCode ??
      null,
  };
  await worker.start({
    onUnhandledRequest: ({ url }, print) => {
      if (new URL(url).pathname.startsWith('/api/')) print.warning();
    },
    quiet: true,
  });
  keepMocksActive();
}

/**
 * The browser stops an idle service worker (within minutes, sooner in a background tab) and the
 * restarted MSW worker forgets which tabs it mocks, so /api calls fall through to the host and
 * come back as index.html. Re-activate this tab when it comes back, and retry once if an /api
 * call still returns HTML.
 */
function keepMocksActive() {
  const reactivate = () =>
    new Promise((resolve) => {
      const controller = navigator.serviceWorker.controller;
      if (!controller) return resolve();
      const timer = setTimeout(done, 2000);
      function done() {
        clearTimeout(timer);
        navigator.serviceWorker.removeEventListener('message', onMessage);
        resolve();
      }
      function onMessage(event) {
        if (event.data?.type === 'MOCKING_ENABLED') done();
      }
      navigator.serviceWorker.addEventListener('message', onMessage);
      controller.postMessage('MOCK_ACTIVATE');
    });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') reactivate();
  });
  window.addEventListener('focus', reactivate);
  window.addEventListener('online', reactivate);
  // The worker can also be stopped while the tab stays visible (e.g. the laptop sleeps)
  setInterval(reactivate, 20_000);

  const retryIfNotMocked = (client) => async (response) => {
    const isHtml = String(response.headers?.['content-type'] ?? '').includes('text/html');
    if (!isHtml || response.config._mockRetried) return response;
    await reactivate();
    return client({ ...response.config, _mockRetried: true });
  };
  api.interceptors.response.use(retryIfNotMocked(api));
  // /auth/refresh goes through plain axios
  axios.interceptors.response.use(retryIfNotMocked(axios));
}
