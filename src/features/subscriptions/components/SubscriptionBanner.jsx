import { AlertTriangle, Info, XCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { Button } from '@/components/ui';
import { ROLES } from '@/constants/roles';
import { SUBSCRIPTION_STATUS as S } from '@/constants/statuses';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth-store';

import { useMySubscription } from '../hooks/useSubscription';
import { bannerFor } from '../lib/status';

const STYLES = {
  info: { icon: Info, className: 'bg-info-50 text-blue-800' },
  warning: { icon: AlertTriangle, className: 'bg-warning-50 text-amber-900' },
  danger: { icon: XCircle, className: 'bg-danger-50 text-red-800' },
};

const WATCHED = [S.TRIAL, S.ACTIVE, S.GRACE, S.EXPIRED];

/** Trial ending, payment failed (grace) and expired warnings above every vendor page. */
export function SubscriptionBanner() {
  const user = useAuthStore((s) => s.user);
  const { pathname } = useLocation();
  const isWatched =
    user?.role === ROLES.VENDOR &&
    user.vendor?.approvalStatus === 'approved' &&
    WATCHED.includes(user.vendor?.subscriptionStatus);
  const { data } = useMySubscription({ enabled: isWatched });
  const banner = isWatched && data ? bannerFor(data) : null;
  if (!banner) return null;
  const { icon: Icon, className } = STYLES[banner.tone];
  return (
    <div role="status" className={cn('border-b border-surface-border', className)}>
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center md:px-6">
        <p className="flex flex-1 items-start gap-2 text-sm font-medium">
          <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {banner.message}
        </p>
        {pathname !== banner.cta.to && (
          <Button asChild size="sm" variant="dark" className="self-start sm:self-auto">
            <Link to={banner.cta.to}>{banner.cta.label}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
