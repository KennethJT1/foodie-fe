import { QueryClientProvider } from '@tanstack/react-query';

import { Toaster } from '@/components/feedback';
import { queryClient } from '@/lib/query-client';

export function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
