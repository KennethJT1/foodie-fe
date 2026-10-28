import { Navigation, Radar } from 'lucide-react';
import { Link } from 'react-router-dom';

import { StatCard } from '@/components/data';
import { EmptyState, ErrorState, Skeleton } from '@/components/feedback';
import { Button, Card } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { formatNaira } from '@/lib/format';

import { JobOfferCard } from './JobOfferCard';
import { OnlineSwitch } from './OnlineSwitch';
import { useActiveDelivery, useEarnings, useJobOffers, useRiderProfile } from '../hooks/useRider';

/** Go online, see job offers, jump back into the current delivery, today's earnings. */
export function RiderHome() {
  const profile = useRiderProfile();
  const active = useActiveDelivery();
  const isOnline = Boolean(profile.data?.isOnline);
  const offers = useJobOffers({ enabled: isOnline && !active.data });
  const earnings = useEarnings();

  if (profile.isLoading || active.isLoading)
    return (
      <div role="status" aria-label="Loading" className="space-y-4">
        <Skeleton className="mx-auto h-36 w-36 rounded-full" />
        <Skeleton className="h-40 rounded-card" />
      </div>
    );
  if (profile.isError)
    return (
      <ErrorState
        title="We couldn't load your account"
        error={profile.error}
        onRetry={profile.refetch}
      />
    );

  const offer = offers.data?.[0];
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-semibold">Hi {profile.data.name.split(' ')[0]}</h1>
      <OnlineSwitch isOnline={isOnline} hasActiveDelivery={Boolean(active.data)} />
      {active.data ? (
        <Card className="flex items-center gap-3">
          <Navigation className="h-6 w-6 shrink-0 text-primary-700" aria-hidden="true" />
          <p className="flex-1 text-sm font-medium">You have a delivery in progress.</p>
          <Button asChild size="sm">
            <Link to={ROUTES.rider.delivery}>Open delivery</Link>
          </Button>
        </Card>
      ) : isOnline ? (
        offer ? (
          <JobOfferCard key={offer.id} offer={offer} />
        ) : (
          <EmptyState
            icon={Radar}
            title="Looking for jobs near you"
            message="Stay close to busy areas. A new job shows up here with a sound and a buzz."
            className="rounded-card border border-dashed border-surface-border"
          />
        )
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Trips today"
          loading={earnings.isLoading}
          value={earnings.data?.today.trips ?? 0}
        />
        <StatCard
          label="Earned today"
          loading={earnings.isLoading}
          value={formatNaira(earnings.data?.today.earnings ?? 0)}
        />
      </div>
    </div>
  );
}
