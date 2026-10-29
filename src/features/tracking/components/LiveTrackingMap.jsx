import { Bike, Phone, Star } from 'lucide-react';

import { MapView } from '@/components/maps';
import { Avatar, Card } from '@/components/ui';
import { ORDER_STATUS } from '@/constants/order-status';
import { formatDistance, formatEta, formatRating } from '@/lib/format';
import { distanceBetween } from '@/lib/geo';

const VEHICLES = { motorcycle: 'Motorbike', bicycle: 'Bicycle', car: 'Car' };

/** Rider, vendor and delivery markers with the route and ETA (FR-GPS-02). */
export function LiveTrackingMap({ order, height = 300 }) {
  const { vendor, rider, address } = order;
  const hasRider = rider?.lat != null && rider?.lng != null;
  const onTheWay = order.status === ORDER_STATUS.PICKED_UP;
  const dropoff = { lat: address.lat, lng: address.lng };

  const markers = [
    vendor && {
      id: 'vendor',
      kind: 'vendor',
      label: vendor.name,
      position: { lat: vendor.lat, lng: vendor.lng },
    },
    { id: 'customer', kind: 'customer', label: 'Your delivery address', position: dropoff },
    hasRider && {
      id: 'rider',
      kind: 'rider',
      label: `Rider ${rider.name}`,
      isActive: true,
      heading: rider.heading,
      position: { lat: rider.lat, lng: rider.lng },
    },
  ].filter(Boolean);

  const route = hasRider
    ? onTheWay
      ? [{ lat: rider.lat, lng: rider.lng }, dropoff]
      : [{ lat: rider.lat, lng: rider.lng }, { lat: vendor.lat, lng: vendor.lng }, dropoff]
    : vendor
      ? [{ lat: vendor.lat, lng: vendor.lng }, dropoff]
      : [];

  const away = hasRider ? distanceBetween(rider, onTheWay ? dropoff : vendor) : null;
  const statusLine = !hasRider
    ? 'We will show your rider here once one is assigned.'
    : onTheWay
      ? `Your rider is ${formatDistance(away)} away · arrives in ${formatEta(order.etaMins?.[0], order.etaMins?.[1])}`
      : `Your rider is heading to ${vendor?.name ?? 'the vendor'} · ${formatDistance(away)} away`;

  return (
    <Card padding="none" className="overflow-hidden">
      <MapView
        height={height}
        markers={markers}
        route={route}
        center={hasRider ? { lat: rider.lat, lng: rider.lng } : dropoff}
        label="Live delivery map"
        className="rounded-none"
      />
      <div className="space-y-3 p-4">
        <p className="text-sm font-medium" aria-live="polite" role="status">
          {statusLine}
        </p>
        {rider?.name && (
          <div className="flex items-center gap-3">
            <Avatar name={rider.name} size="md" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-semibold">{rider.name}</p>
              <p className="flex flex-wrap items-center gap-x-2 text-ink-muted">
                <span className="inline-flex items-center gap-1">
                  <Bike className="h-3.5 w-3.5" aria-hidden="true" />
                  {VEHICLES[rider.vehicleType] ?? 'Rider'} {rider.plateNumber}
                </span>
                {rider.rating ? (
                  <span className="inline-flex items-center gap-0.5">
                    <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden="true" />
                    {formatRating(rider.rating)}
                  </span>
                ) : null}
              </p>
            </div>
            {rider.phone && (
              <a
                href={`tel:${rider.phone}`}
                aria-label={`Call ${rider.name}`}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-surface-border hover:bg-primary-50"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
