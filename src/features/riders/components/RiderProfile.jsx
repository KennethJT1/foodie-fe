import { Bike, Landmark, Star } from 'lucide-react';

import { PageHeader } from '@/components/data';
import { ErrorState, SkeletonText } from '@/components/feedback';
import { Card, CardTitle } from '@/components/ui';
import { formatCount, formatPhone, formatRating } from '@/lib/format';

import { VEHICLE_LABELS } from '../constants';
import { useRiderProfile } from '../hooks/useRider';

/** Rider details (vehicle, rating, payout account). `children` adds the account form. */
export function RiderProfile({ children }) {
  const { data, isLoading, isError, error, refetch } = useRiderProfile();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="Profile" />
      {isLoading ? (
        <SkeletonText lines={5} />
      ) : isError ? (
        <ErrorState title="We couldn't load your profile" error={error} onRetry={refetch} />
      ) : (
        <Card
          header={
            <CardTitle title="Rider details" description="Contact support to change these." />
          }
        >
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div className="flex gap-3">
              <Bike className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden="true" />
              <div>
                <dt className="text-ink-muted">Vehicle</dt>
                <dd className="font-medium">
                  {VEHICLE_LABELS[data.vehicleType] ?? '—'}
                  {data.plateNumber && ` · ${data.plateNumber}`}
                </dd>
              </div>
            </div>
            <div className="flex gap-3">
              <Star className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
              <div>
                <dt className="text-ink-muted">Rating</dt>
                <dd className="font-medium">
                  {formatRating(data.rating)} from {formatCount(data.ratingCount)} customers ·{' '}
                  {formatCount(data.tripsCount)} trips
                </dd>
              </div>
            </div>
            <div className="flex gap-3">
              <Landmark className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden="true" />
              <div>
                <dt className="text-ink-muted">Payout account</dt>
                <dd className="font-medium">
                  {data.bank
                    ? `${data.bank.bankName} · ending ${data.bank.accountNumberLast4}`
                    : '—'}
                </dd>
              </div>
            </div>
            <div>
              <dt className="text-ink-muted">Phone</dt>
              <dd className="font-medium">{formatPhone(data.phone)}</dd>
            </div>
          </dl>
        </Card>
      )}
      {children}
    </div>
  );
}
