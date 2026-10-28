import { Check, MessageSquare, Navigation, PackageCheck, Phone } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { EmptyState, ErrorState, Skeleton, toast } from '@/components/feedback';
import { OtpBoxes } from '@/components/forms';
import { MapView } from '@/components/maps';
import { Button, Card } from '@/components/ui';
import { ORDER_STATUS } from '@/constants/order-status';
import { ROUTES } from '@/constants/routes';
import { DeliveryChat } from '@/features/tracking';
import { cn } from '@/lib/cn';
import { formatDistance, formatNaira, formatOrderNumber } from '@/lib/format';

import {
  useActiveDelivery,
  useCompleteDelivery,
  usePickup,
  useRiderProfile,
} from '../hooks/useRider';
import { directionsUrl, travelModeFor } from '../lib/directions';

const STEPS = ['To the vendor', 'Picked up', 'To the customer', 'Delivered'];

function Steps({ index }) {
  return (
    <ol className="grid grid-cols-4 gap-1" aria-label="Delivery steps">
      {STEPS.map((label, i) => (
        <li
          key={label}
          aria-current={i === index ? 'step' : undefined}
          className="space-y-1 text-center"
        >
          <span
            className={cn(
              'mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
              i < index
                ? 'bg-secondary text-white'
                : i === index
                  ? 'bg-primary text-ink'
                  : 'bg-surface-muted text-ink-muted',
            )}
          >
            {i < index ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
          </span>
          <span
            className={cn(
              'block text-[11px] leading-tight',
              i === index ? 'font-semibold' : 'text-ink-muted',
            )}
          >
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

function ContactButtons({ name, phone, canText }) {
  if (!phone) return null;
  return (
    <div className="flex gap-2">
      <Button asChild variant="outline" size="sm" leftIcon={<Phone className="h-4 w-4" />}>
        <a href={`tel:${phone}`}>Call {name.split(' ')[0]}</a>
      </Button>
      {canText && (
        <Button
          asChild
          variant="outline"
          size="sm"
          leftIcon={<MessageSquare className="h-4 w-4" />}
        >
          <a href={`sms:${phone}`}>Text</a>
        </Button>
      )}
    </div>
  );
}

function CompleteDelivery({ delivery }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const complete = useCompleteDelivery();
  const navigate = useNavigate();
  const submit = (value = code) => {
    if (!/^\d{4}$/.test(value)) return setError('Enter the 4-digit code from the customer');
    complete.mutate(
      { id: delivery.id, code: value },
      {
        onSuccess: (r) => {
          toast.success(`Delivered. You earned ${formatNaira(r.earning)}.`);
          navigate(ROUTES.rider.root);
        },
        onError: (e) => setError(e.fieldErrors?.code ?? e.message),
      },
    );
  };
  return (
    <div className="space-y-3 border-t border-surface-border pt-4">
      <p className="text-sm font-medium">
        Ask {delivery.dropoff.name.split(' ')[0]} for their delivery code
      </p>
      <OtpBoxes
        length={4}
        label="Delivery code"
        value={code}
        error={error}
        onChange={(v) => {
          setCode(v);
          setError(null);
        }}
      />
      <Button
        size="lg"
        fullWidth
        variant="secondary"
        loading={complete.isPending}
        onClick={() => submit()}
      >
        Complete delivery
      </Button>
    </div>
  );
}

/** The current job: map, steps, directions, call the vendor or customer, pick up, hand over. */
export function ActiveDelivery() {
  const {
    data: delivery,
    isLoading,
    isError,
    error,
    refetch,
  } = useActiveDelivery({ refetchInterval: 30000 });
  const profile = useRiderProfile();
  const pickup = usePickup();

  if (isLoading)
    return (
      <div role="status" aria-label="Loading delivery" className="space-y-4">
        <Skeleton className="h-60 rounded-card" />
        <Skeleton className="h-40 rounded-card" />
      </div>
    );
  if (isError)
    return <ErrorState title="We couldn't load your delivery" error={error} onRetry={refetch} />;
  if (!delivery)
    return (
      <EmptyState
        icon={Navigation}
        title="No delivery right now"
        message="Go online to get jobs. Accepted jobs show up here."
        action={
          <Button asChild>
            <Link to={ROUTES.rider.root}>Go to home</Link>
          </Button>
        }
      />
    );

  const pickedUp = delivery.status === ORDER_STATUS.PICKED_UP;
  const target = pickedUp ? delivery.dropoff : delivery.pickup;
  const me =
    profile.data?.lat != null ? { lat: profile.data.lat, lng: profile.data.lng } : delivery.rider;
  const mode = travelModeFor(profile.data?.vehicleType);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-baseline justify-between gap-2">
        <h1 className="text-xl font-semibold">Order {formatOrderNumber(delivery.orderCode)}</h1>
        <span className="text-sm text-ink-muted">You earn {formatNaira(delivery.earning)}</span>
      </div>
      <Steps index={pickedUp ? 2 : 0} />
      <MapView
        height={240}
        label="Delivery map"
        center={target}
        markers={[
          me?.lat != null && {
            id: 'me',
            kind: 'rider',
            label: 'You',
            isActive: true,
            position: me,
          },
          { id: 'pickup', kind: 'vendor', label: delivery.pickup.name, position: delivery.pickup },
          {
            id: 'dropoff',
            kind: 'customer',
            label: delivery.dropoff.name,
            position: delivery.dropoff,
          },
        ].filter(Boolean)}
        route={me?.lat != null ? [me, target] : [delivery.pickup, delivery.dropoff]}
      />
      <Card className="space-y-4" aria-live="polite">
        <div>
          <p className="text-sm text-ink-muted">{pickedUp ? 'Deliver to' : 'Pick up from'}</p>
          <p className="text-lg font-semibold">{target.name}</p>
          <p className="text-sm">{target.address}</p>
          {pickedUp && target.note && (
            <p className="mt-1 rounded-lg bg-surface-muted p-2 text-sm">Note: {target.note}</p>
          )}
          {!pickedUp && (
            <p className="mt-1 text-sm text-ink-muted">
              {delivery.itemCount} items · {formatDistance(delivery.distanceM)} to the customer
              after pickup
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" leftIcon={<Navigation className="h-4 w-4" />}>
            <a href={directionsUrl(target, mode)} target="_blank" rel="noreferrer">
              Directions
            </a>
          </Button>
          <ContactButtons name={target.name} phone={target.phone} canText={pickedUp} />
        </div>
        {pickedUp ? (
          <CompleteDelivery delivery={delivery} />
        ) : (
          <Button
            size="lg"
            fullWidth
            leftIcon={<PackageCheck className="h-5 w-5" />}
            loading={pickup.isPending}
            onClick={() =>
              pickup.mutate(delivery.id, {
                onSuccess: () => toast.success('Picked up. Head to the customer.'),
                onError: (e) => toast.error(e),
              })
            }
          >
            I&apos;ve picked up the order
          </Button>
        )}
      </Card>
      <DeliveryChat order={{ id: delivery.orderId, status: delivery.status }} viewerRole="rider" />
    </div>
  );
}
