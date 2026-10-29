import { QueryClient } from '@tanstack/react-query';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (count, error) => count < 1 && !(error?.status >= 400 && error?.status < 500),
        staleTime: 30_000,
        refetchOnWindowFocus: true,
      },
      mutations: { retry: 0 },
    },
  });
}

export const queryClient = createQueryClient();
