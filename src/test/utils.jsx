import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { createQueryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth-store';

/*
 * Tests use <MemoryRouter> rather than a data router: data routers build fetch Requests with
 * jsdom's AbortSignal, which Node's fetch rejects.
 */

function LocationProbe({ onChange }) {
  onChange(useLocation());
  return null;
}

/**
 * Renders UI inside a memory router and a fresh QueryClient.
 * `routes` ([{ path, element }]) mounts several pages so redirects can be followed;
 * otherwise `ui` is mounted at `path`. `location()` returns the current location.
 */
export function renderWithProviders(ui, { route = '/', path = '*', routes } = {}) {
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { retry: false, staleTime: 0 } });
  let current = null;
  const list = routes ?? [{ path, element: ui }];
  const result = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <LocationProbe onChange={(l) => (current = l)} />
        <Routes>
          {list.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...result, queryClient, location: () => current };
}

/** Signs a demo user in for tests (mock tokens). */
export function signInAs(user) {
  useAuthStore.setState({
    user,
    accessToken: `mock.${user.id}.${Date.now() + 3600000}`,
    status: 'authenticated',
  });
}

/**
 * Mounts the real route tree (lazy pages, guards, layouts) at `route`.
 * Pass `as` with a demo email to start signed in, or 'anonymous'.
 */
export async function renderApp(route, { as } = {}) {
  const [{ routes }, { createMemoryRouter, RouterProvider: Provider }, { db }, { sessionUser }] =
    await Promise.all([
      import('@/app/router'),
      import('react-router-dom'),
      import('@/mocks/db'),
      import('@/mocks/utils/auth'),
    ]);
  if (as === 'anonymous')
    useAuthStore.setState({ user: null, accessToken: null, status: 'anonymous' });
  else if (as) {
    const user = db.users.find((u) => u.email === as);
    signInAs(sessionUser(user));
  }
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { retry: false } });
  const router = createMemoryRouter(routes, { initialEntries: [route] });
  const result = render(
    <QueryClientProvider client={queryClient}>
      <Provider router={router} />
    </QueryClientProvider>,
  );
  return { ...result, router, queryClient };
}
