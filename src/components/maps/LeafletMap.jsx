import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { RiderMarker } from './markers';

// OpenStreetMap tiles: free, no API key (https://operations.osmfoundation.org/policies/tiles/)
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const LAGOS = { lat: 6.5244, lng: 3.3792 };

const toLatLng = (p) => [p.lat, p.lng];

/**
 * Free map (Leaflet + OpenStreetMap). Same props as the Google renderer: markers are drawn with
 * RiderMarker through portals, `route` is a polyline, and the view fits every marker.
 */
export function LeafletMapView({
  center,
  zoom = 14,
  markers = [],
  route = [],
  onMapClick,
  fitToMarkers = true,
}) {
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const markerObjs = useRef(new Map()); // id → L.marker
  const clickRef = useRef(onMapClick);
  clickRef.current = onMapClick;
  const [elements, setElements] = useState({}); // id → marker DOM element (portal target)

  // Create the map once
  useEffect(() => {
    const start = center ?? markers[0]?.position ?? LAGOS;
    const map = L.map(boxRef.current, { zoomControl: true }).setView(toLatLng(start), zoom);
    L.tileLayer(TILES, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map);
    map.on('click', (e) => clickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng }));
    mapRef.current = map;

    // Drawers and lazy panels change the box size after mount; Leaflet must re-measure
    const ro =
      typeof ResizeObserver !== 'undefined' && new ResizeObserver(() => map.invalidateSize());
    if (ro) ro.observe(boxRef.current);
    const objs = markerObjs.current;
    return () => {
      if (ro) ro.disconnect();
      objs.clear();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add, move and remove markers (moved, not recreated, so a live rider glides)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const objs = markerObjs.current;
    const ids = new Set(markers.map((m) => m.id));
    let changed = false;
    objs.forEach((mk, id) => {
      if (!ids.has(id)) {
        mk.remove();
        objs.delete(id);
        changed = true;
      }
    });
    markers.forEach((m) => {
      if (!m.position) return;
      const existing = objs.get(m.id);
      if (existing) {
        existing.setLatLng(toLatLng(m.position));
        return;
      }
      const mk = L.marker(toLatLng(m.position), {
        icon: L.divIcon({ className: 'kjt-map-marker', html: '', iconSize: [0, 0] }),
        interactive: false,
        keyboard: false,
      }).addTo(map);
      objs.set(m.id, mk);
      changed = true;
    });
    if (changed) {
      setElements(Object.fromEntries([...objs].map(([id, mk]) => [id, mk.getElement()])));
    }
  }, [markers]);

  // Route line
  const routeKey = JSON.stringify(route);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || route.length < 2) return undefined;
    const line = L.polyline(route.map(toLatLng), {
      color: '#E85D04',
      opacity: 0.9,
      weight: 5,
    }).addTo(map);
    return () => line.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  // Keep every marker in view, or follow `center` (city picked, "Use my location")
  const pointsKey = JSON.stringify(markers.map((m) => m.position));
  const centerKey = JSON.stringify(center ?? null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const points = markers.map((m) => m.position).filter(Boolean);
    if (fitToMarkers && points.length >= 2) {
      map.fitBounds(L.latLngBounds(points.map(toLatLng)), { padding: [60, 60] });
    } else if (center && !map.getBounds().pad(-0.2).contains(toLatLng(center))) {
      map.panTo(toLatLng(center));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsKey, centerKey, fitToMarkers]);

  return (
    <>
      <div ref={boxRef} style={{ width: '100%', height: '100%' }} />
      {markers.map(
        (m) =>
          elements[m.id] &&
          createPortal(
            <RiderMarker kind={m.kind} label={m.label} isActive={m.isActive} />,
            elements[m.id],
            m.id,
          ),
      )}
    </>
  );
}
