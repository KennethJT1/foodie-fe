import { MapPin, Store } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { toast } from '@/components/feedback';
import { Button, Card } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/cn';
import { secondsLeft } from '@/lib/countdown';
import { formatDistance, formatNaira } from '@/lib/format';

import { useAcceptOffer, useDeclineOffer } from '../hooks/useRider';

/** A delivery job with a 30-second countdown; when it runs out the job goes to someone else. */
export function JobOfferCard({ offer }) {
  const [left, setLeft] = useState(() => secondsLeft(offer.expiresAt));
  const accept = useAcceptOffer();
  const decline = useDeclineOffer();
  const navigate = useNavigate();
  const ended = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setLeft(secondsLeft(offer.expiresAt)), 1000);
    return () => clearInterval(t);
  }, [offer.expiresAt]);

  useEffect(() => {
    if (left > 0 || ended.current) return;
    ended.current = true;
    decline.mutate(offer.id);
    toast.info('That job timed out. We will send you another one.');
  }, [left, offer.id, decline]);

  return (
    <Card as="article" aria-label="New delivery job" className="space-y-4 border-2 border-primary">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-ink-muted">New job · you earn</p>
          <p className="font-heading text-3xl font-bold">{formatNaira(offer.earning)}</p>
        </div>
        <span
          role="timer"
          aria-label={`${left} seconds to accept`}
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold tabular-nums',
            left <= 10 ? 'bg-danger-50 text-red-700' : 'bg-primary-50 text-primary-700',
          )}
        >
          {left}s
        </span>
      </div>
      <ol className="space-y-3 text-sm">
        <li className="flex gap-3">
          <Store className="mt-0.5 h-5 w-5 shrink-0 text-primary-700" aria-hidden="true" />
          <span>
            <span className="block font-medium">Pick up at {offer.pickup.name}</span>
            <span className="text-ink-muted">
              {offer.pickup.area}
              {offer.toPickupM != null && ` · ${formatDistance(offer.toPickupM)} from you`}
            </span>
          </span>
        </li>
        <li className="flex gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-secondary" aria-hidden="true" />
          <span>
            <span className="block font-medium">
              Drop off in {offer.dropoff.area || offer.dropoff.city}
            </span>
            <span className="text-ink-muted">{formatDistance(offer.distanceM)} delivery</span>
          </span>
        </li>
      </ol>
      <div className="flex gap-2">
        <Button
          size="lg"
          variant="secondary"
          className="flex-1"
          loading={accept.isPending}
          disabled={left === 0}
          onClick={() =>
            accept.mutate(offer.id, {
              onSuccess: () => navigate(ROUTES.rider.delivery),
              onError: (e) => toast.error(e),
            })
          }
        >
          Accept job
        </Button>
        <Button
          size="lg"
          variant="outline"
          disabled={accept.isPending}
          onClick={() => decline.mutate(offer.id)}
        >
          Decline
        </Button>
      </div>
    </Card>
  );
}
