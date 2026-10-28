import { AdvancedMarker, APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';

import { env } from '@/lib/env';

import { RiderMarker } from './markers';

/** Draws a polyline on the current Google map. */
export function RouteLine({ path = [], color = '#E85D04' }) {
  const map = useMap();
  useEffect(() => {
    if (!map || path.length < 2 || !window.google?.maps) return undefined;
    const line = new window.google.maps.Polyline({
      path,
      strokeColor: color,
      strokeOpacity: 0.9,
      strokeWeight: 5,
      map,
    });
    return () => line.setMap(null);
  }, [map, path, color]);
  return null;
}

/** Keeps every marker in view. */
function FitBounds({ points }) {
  const map = useMap();
  const key = JSON.stringify(points);
  useEffect(() => {
    if (!map || points.length < 2 || !window.google?.maps) return;
    const b = new window.google.maps.LatLngBounds();
    points.forEach((p) => b.extend(p));
    map.fitBounds(b, 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

export function GoogleMapView({
  center,
  zoom = 14,
  markers = [],
  route = [],
  onMapClick,
  fitToMarkers = true,
}) {
  return (
    <APIProvider apiKey={env.googleMapsKey}>
      <Map
        defaultCenter={center ?? markers[0]?.position}
        defaultZoom={zoom}
        mapId="DEMO_MAP_ID"
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        onClick={(e) => e.detail.latLng && onMapClick?.(e.detail.latLng)}
        style={{ width: '100%', height: '100%' }}
      >
        {markers.map((m) => (
          <AdvancedMarker key={m.id} position={m.position} title={m.label}>
            <RiderMarker kind={m.kind} label={m.label} isActive={m.isActive} />
          </AdvancedMarker>
        ))}
        <RouteLine path={route} />
        {fitToMarkers && <FitBounds points={markers.map((m) => m.position)} />}
      </Map>
    </APIProvider>
  );
}
