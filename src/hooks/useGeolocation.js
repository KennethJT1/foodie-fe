import { useEffect, useState } from 'react';

const isSupported = () => typeof navigator !== 'undefined' && Boolean(navigator.geolocation);

/**
 * Watches the device position while `enabled` (riders: only while online).
 * Returns `{ position: { lat, lng, heading } | null, error, isSupported }`.
 */
export function useGeolocation({ enabled = true } = {}) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !isSupported()) return undefined;
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setError(null);
        setPosition({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          heading: Number.isFinite(p.coords.heading) ? p.coords.heading : null,
        });
      },
      (e) =>
        setError(
          e.code === 1
            ? 'Location is blocked. Allow location for KJT Foodie in your browser settings.'
            : "We can't find your location right now.",
        ),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [enabled]);

  return { position, error, isSupported: isSupported() };
}
