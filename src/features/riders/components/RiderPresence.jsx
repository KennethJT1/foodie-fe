import { MapPinOff, MonitorSmartphone } from 'lucide-react';

import { ROLES } from '@/constants/roles';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useAuthStore } from '@/stores/auth-store';

import { useLocationBroadcast, useRiderSocket } from '../hooks/useRider';

function Notice({ icon: Icon, children }) {
  return (
    <p className="flex items-start gap-2 border-b border-surface-border bg-warning-50 px-4 py-2 text-sm text-amber-900 md:px-6">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}

/**
 * Mounted once in the rider layout. While online: listens for job offers, sends the rider's
 * location every few seconds and keeps the screen on, on every rider page.
 */
export function RiderPresence() {
  const user = useAuthStore((s) => s.user);
  const rider = user?.role === ROLES.RIDER ? user.rider : null;
  const isOnline = Boolean(rider?.isOnline && rider.approvalStatus === 'approved');
  const geo = useGeolocation({ enabled: isOnline });
  const wake = useWakeLock(isOnline);
  useRiderSocket({ riderId: rider?.id, isOnline });
  useLocationBroadcast({ riderId: rider?.id, enabled: isOnline, position: geo.position });

  if (!isOnline) return null;
  return (
    <div role="status">
      {(geo.error || !geo.isSupported) && (
        <Notice icon={MapPinOff}>
          {geo.error ?? "This browser can't share your location. Customers won't see you move."}
        </Notice>
      )}
      {!wake.isActive && (
        <Notice icon={MonitorSmartphone}>
          Keep your screen on while you&apos;re online so you don&apos;t miss a job.
        </Notice>
      )}
    </div>
  );
}
