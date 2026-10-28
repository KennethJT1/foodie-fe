import { Bike } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { PageHeader, StatCard } from '@/components/data';
import { EmptyState, ErrorState, Skeleton } from '@/components/feedback';
import { MapView, NIGERIAN_CITIES } from '@/components/maps';
import { Card, CardTitle, Select } from '@/components/ui';
import { getOrderStatusMeta, ORDER_STATUS } from '@/constants/order-status';
import { ROUTES } from '@/constants/routes';
import { formatOrderNumber, formatRelative } from '@/lib/format';

import { useLiveMap } from '../hooks/useLiveMap';

/** Dispatch view: online riders and active deliveries in a city, updated live (FR-GPS-04). */
export function AdminLiveMap() {
  const { data, isLoading, isError, error, refetch } = useLiveMap();
  const [city, setCity] = useState('Lagos');
  const centre = NIGERIAN_CITIES.find((c) => c.city === city) ?? NIGERIAN_CITIES[0];

  if (isError)
    return <ErrorState title="We couldn't load the live map" error={error} onRetry={refetch} />;
  const riders = (data?.riders ?? []).filter((r) => r.city === city);
  const deliveries = (data?.deliveries ?? []).filter((d) => d.city === city);
  const waiting = deliveries.filter(
    (d) => d.status === ORDER_STATUS.READY_FOR_PICKUP && !d.riderId,
  );
  const ridersById = new Map(riders.map((r) => [r.id, r]));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Live map"
        description={
          data ? `Updated ${formatRelative(data.at)}` : 'Online riders and active deliveries.'
        }
        actions={
          <Select
            label="City"
            labelHidden
            value={city}
            onValueChange={setCity}
            options={NIGERIAN_CITIES.map((c) => ({ value: c.city, label: c.city }))}
          />
        }
      />
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Riders online" loading={isLoading} value={riders.length} />
        <StatCard label="Active deliveries" loading={isLoading} value={deliveries.length} />
        <StatCard label="Waiting for a rider" loading={isLoading} value={waiting.length} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {isLoading ? (
          <Skeleton className="h-[420px] rounded-card" />
        ) : (
          <MapView
            height={420}
            label={`Live map of ${city}`}
            center={centre}
            markers={[
              ...riders.map((r) => ({
                id: `rider-${r.id}`,
                kind: 'rider',
                label: `${r.name}${r.orderId ? ' (on a delivery)' : ''}`,
                isActive: Boolean(r.orderId),
                position: { lat: r.lat, lng: r.lng },
              })),
              ...waiting.map((d) => ({
                id: `pickup-${d.orderId}`,
                kind: 'vendor',
                label: `${d.vendor.name}: ${formatOrderNumber(d.code)} waiting`,
                position: { lat: d.vendor.lat, lng: d.vendor.lng },
              })),
            ]}
          />
        )}
        <Card header={<CardTitle title="Active deliveries" />} padding="sm">
          {deliveries.length ? (
            <ul className="max-h-[360px] divide-y divide-surface-border overflow-y-auto text-sm">
              {deliveries.map((d) => (
                <li key={d.orderId} className="py-2">
                  <Link
                    to={ROUTES.admin.order(d.orderId)}
                    className="font-medium text-primary-700 hover:underline"
                  >
                    {formatOrderNumber(d.code)}
                  </Link>
                  <span className="ml-2 text-xs text-ink-muted">
                    {getOrderStatusMeta(d.status).label}
                  </span>
                  <p className="text-xs text-ink-muted">
                    {d.vendor.name} → {d.dropoff.area || 'customer'}
                    {d.riderId
                      ? ` · ${ridersById.get(d.riderId)?.name ?? 'rider'}`
                      : ' · no rider yet'}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState compact icon={Bike} title={`No active deliveries in ${city}`} />
          )}
        </Card>
      </div>
    </div>
  );
}
