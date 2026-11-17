import { lazy, Suspense } from 'react';

import { Skeleton } from '@/components/feedback/Skeleton';
import { cn } from '@/lib/cn';
import { env } from '@/lib/env';

import { FallbackMap } from './FallbackMap';

const GoogleMapView = lazy(() => import('./GoogleMap').then((m) => ({ default: m.GoogleMapView })));
const LeafletMapView = lazy(() =>
  import('./LeafletMap').then((m) => ({ default: m.LeafletMapView })),
);

// Google Maps needs a billed account, so it is opt-in: VITE_MAP_PROVIDER=google plus a key.
// Otherwise the free OpenStreetMap map. Unit tests (jsdom can't draw tiles) get the schematic.
const provider =
  import.meta.env.MODE === 'test'
    ? 'schematic'
    : env.mapProvider === 'google' && env.googleMapsKey
      ? 'google'
      : 'osm';

/**
 * Map with markers and an optional route: OpenStreetMap (free) by default, Google Maps when
 * VITE_MAP_PROVIDER=google, a schematic preview in unit tests.
 * markers: [{ id, position: { lat, lng }, kind: 'rider'|'vendor'|'customer'|'pin', label, isActive? }]
 */
export function MapView({
  center,
  zoom,
  markers = [],
  route = [],
  onMapClick,
  height = 320,
  className,
  label = 'Map',
}) {
  return (
    <div
      role="region"
      aria-label={label}
      className={cn('isolate overflow-hidden rounded-card bg-gray-100', className)}
      style={{ height }}
    >
      {provider === 'schematic' ? (
        <FallbackMap center={center} markers={markers} route={route} onMapClick={onMapClick} />
      ) : (
        <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
          {provider === 'google' ? (
            <GoogleMapView
              center={center}
              zoom={zoom}
              markers={markers}
              route={route}
              onMapClick={onMapClick}
            />
          ) : (
            <LeafletMapView
              center={center}
              zoom={zoom}
              markers={markers}
              route={route}
              onMapClick={onMapClick}
            />
          )}
        </Suspense>
      )}
    </div>
  );
}
