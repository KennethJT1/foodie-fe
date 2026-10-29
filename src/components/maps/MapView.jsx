import { lazy, Suspense } from 'react';

import { Skeleton } from '@/components/feedback/Skeleton';
import { cn } from '@/lib/cn';
import { env } from '@/lib/env';

import { FallbackMap } from './FallbackMap';

const GoogleMapView = lazy(() => import('./GoogleMap').then((m) => ({ default: m.GoogleMapView })));

/**
 * Map with markers and an optional route. Uses Google Maps when VITE_GOOGLE_MAPS_KEY is set,
 * otherwise a schematic preview so tracking can be built on mocks.
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
      className={cn('overflow-hidden rounded-card bg-gray-100', className)}
      style={{ height }}
    >
      {env.googleMapsKey ? (
        <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
          <GoogleMapView
            center={center}
            zoom={zoom}
            markers={markers}
            route={route}
            onMapClick={onMapClick}
          />
        </Suspense>
      ) : (
        <FallbackMap center={center} markers={markers} route={route} onMapClick={onMapClick} />
      )}
    </div>
  );
}
