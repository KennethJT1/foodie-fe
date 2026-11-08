import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

import { registerMockSocket } from '@/lib/socket';
import { isDbDirty, resetDb } from '@/mocks/db';
import { configureOrderSimulation, registerRealtime, stopOrderSimulations } from '@/mocks/realtime';
import { server } from '@/mocks/server';
import { createMockSocket } from '@/mocks/socket';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore } from '@/stores/cart-store';
import { useUiStore } from '@/stores/ui-store';

// jsdom's XHR sends FormData as text/plain, so multipart never reaches MSW in tests (browsers are
// fine, and mock mode in the browser goes through the POST /uploads mock handler). Here an upload
// just keeps the compressed image as a data URL, which is what that handler returns too.
vi.mock('@/lib/upload', async () => {
  const { compressImage } = await import('@/lib/image');
  return { uploadFile: async (file) => (await compressImage(file)).dataUrl };
});

// Lazy route chunks load cold in the first test of each file; give findBy* room on slow machines
configure({ asyncUtilTimeout: 5000 });

registerMockSocket(createMockSocket);
registerRealtime();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  stopOrderSimulations();
  configureOrderSimulation({ enabled: false });
  useAuthStore.setState({ user: null, accessToken: null, status: 'idle' });
  useCartStore.getState().clear();
  useUiStore.setState({ isCartOpen: false, isMobileNavOpen: false });
  server.resetHandlers();
  if (isDbDirty()) resetDb();
  window.localStorage.clear();
});
afterAll(() => server.close());

// React Router data routers build fetch Requests with jsdom's AbortSignal, which Node's
// Request rejects. Tests don't abort navigations, so drop the signal.
const NodeRequest = globalThis.Request;
globalThis.Request = class extends NodeRequest {
  constructor(input, init = {}) {
    // eslint-disable-next-line no-unused-vars
    const { signal, ...rest } = init;
    super(input, rest);
  }
};

// jsdom gaps used by components
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}
if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
if (!window.IntersectionObserver) {
  window.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
