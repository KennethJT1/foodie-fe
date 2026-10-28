import { WifiOff } from 'lucide-react';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;
  return (
    <div
      role="status"
      className="sticky top-0 z-[60] flex items-center justify-center gap-2 bg-ink px-4 py-2 text-sm text-white"
    >
      <WifiOff className="h-4 w-4" aria-hidden="true" />
      You&apos;re offline. We&apos;ll update when you&apos;re back.
    </div>
  );
}
