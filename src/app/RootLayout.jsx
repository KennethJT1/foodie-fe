import { lazy, Suspense } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';

import { OfflineBanner } from '@/components/feedback';
import { useSessionBootstrap } from '@/features/auth';
import { MockPaystackSheet } from '@/features/payments';
import { env } from '@/lib/env';

const DevRoleSwitcher =
  env.isDev && env.useMocks ? lazy(() => import('./dev/DevRoleSwitcher')) : null;

// The MSW worker owns the scope on mocks, so the app's own worker only runs without them
const AppUpdates =
  !env.isDev && !env.useMocks && typeof navigator !== 'undefined' && 'serviceWorker' in navigator
    ? lazy(() => import('./pwa/AppUpdates'))
    : null;

export function RootLayout() {
  useSessionBootstrap();
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[70] focus:rounded focus:bg-surface focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>
      <OfflineBanner />
      <Outlet />
      <ScrollRestoration />
      <MockPaystackSheet />
      {AppUpdates && (
        <Suspense fallback={null}>
          <AppUpdates />
        </Suspense>
      )}
      {DevRoleSwitcher && (
        <Suspense fallback={null}>
          <DevRoleSwitcher />
        </Suspense>
      )}
    </>
  );
}
