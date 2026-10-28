import { useMemo, useRef } from 'react';

import { cn } from '@/lib/cn';

import { RiderMarker } from './markers';

/**
 * Schematic map used when there is no Google Maps key (local development on mocks).
 * Projects lat/lng into the box that fits every marker and route point.
 */
export function FallbackMap({
  center,
  markers = [],
  route = [],
  onMapClick,
  className,
  zoomKm = 3,
}) {
  const ref = useRef(null);
  const bounds = useMemo(() => {
    const pts = [...markers.map((m) => m.position), ...route, ...(center ? [center] : [])].filter(
      Boolean,
    );
    if (!pts.length) return null;
    let minLat = Math.min(...pts.map((p) => p.lat));
    let maxLat = Math.max(...pts.map((p) => p.lat));
    let minLng = Math.min(...pts.map((p) => p.lng));
    let maxLng = Math.max(...pts.map((p) => p.lng));
    const minSpan = zoomKm / 111;
    if (maxLat - minLat < minSpan) {
      const c = (maxLat + minLat) / 2;
      minLat = c - minSpan / 2;
      maxLat = c + minSpan / 2;
    }
    if (maxLng - minLng < minSpan) {
      const c = (maxLng + minLng) / 2;
      minLng = c - minSpan / 2;
      maxLng = c + minSpan / 2;
    }
    const padLat = (maxLat - minLat) * 0.15;
    const padLng = (maxLng - minLng) * 0.15;
    return {
      minLat: minLat - padLat,
      maxLat: maxLat + padLat,
      minLng: minLng - padLng,
      maxLng: maxLng + padLng,
    };
  }, [markers, route, center, zoomKm]);

  const project = (p) =>
    bounds
      ? {
          x: ((p.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100,
          y: ((bounds.maxLat - p.lat) / (bounds.maxLat - bounds.minLat)) * 100,
        }
      : { x: 50, y: 50 };

  const onClick = (e) => {
    if (!onMapClick || !bounds || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    onMapClick({
      lat: bounds.maxLat - y * (bounds.maxLat - bounds.minLat),
      lng: bounds.minLng + x * (bounds.maxLng - bounds.minLng),
    });
  };

  const path = route
    .map((p) => project(p))
    .map((p) => `${p.x},${p.y}`)
    .join(' ');

  return (
    // The click-to-pin surface is mouse/touch only; AddressPicker also offers typed fields.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      ref={ref}
      onClick={onClick}
      className={cn(
        'relative h-full w-full overflow-hidden bg-[#EEF2E6]',
        onMapClick && 'cursor-crosshair',
        className,
      )}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <pattern id="kjt-grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M10 0H0V10" fill="none" stroke="#D9DFCC" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#kjt-grid)" />
        <path d="M0 62 C 25 55, 40 75, 100 58" stroke="#fff" strokeWidth="2.4" fill="none" />
        <path d="M30 0 C 34 30, 26 60, 38 100" stroke="#fff" strokeWidth="2" fill="none" />
        <path d="M70 0 C 66 40, 78 70, 72 100" stroke="#fff" strokeWidth="1.6" fill="none" />
        <path d="M0 22 C 40 28, 60 16, 100 26" stroke="#fff" strokeWidth="1.4" fill="none" />
        {path && (
          <polyline
            points={path}
            fill="none"
            stroke="#E85D04"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="2 1.2"
            vectorEffect="non-scaling-stroke"
            style={{ strokeWidth: 4 }}
          />
        )}
      </svg>
      {markers.map((m) => {
        const p = project(m.position);
        return (
          <span
            key={m.id}
            className="absolute transition-all duration-1000 ease-linear"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <RiderMarker kind={m.kind} label={m.label} isActive={m.isActive} />
          </span>
        );
      })}
      <span className="absolute bottom-1 right-2 text-[10px] text-ink-muted">
        Map preview · add a Google Maps key for live maps
      </span>
    </div>
  );
}
