import { LocateFixed } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

import { MapView } from './MapView';

export const NIGERIAN_CITIES = [
  { city: 'Lagos', state: 'Lagos', lat: 6.5244, lng: 3.3792 },
  { city: 'Abuja', state: 'FCT', lat: 9.0765, lng: 7.3986 },
  { city: 'Port Harcourt', state: 'Rivers', lat: 4.8156, lng: 7.0498 },
  { city: 'Ibadan', state: 'Oyo', lat: 7.3775, lng: 3.947 },
  { city: 'Enugu', state: 'Enugu', lat: 6.4584, lng: 7.5464 },
  { city: 'Kano', state: 'Kano', lat: 12.0022, lng: 8.592 },
  { city: 'Benin City', state: 'Edo', lat: 6.335, lng: 5.6037 },
  { city: 'Kaduna', state: 'Kaduna', lat: 10.5105, lng: 7.4165 },
];

/**
 * Street, area, city and a map pin. `value`: { line1, area, city, state, lat, lng }.
 * Customers drop a pin or use their location (FR-ORD-04).
 */
export function AddressPicker({
  value = {},
  onChange,
  errors = {},
  mapHeight = 220,
  label = 'Delivery address',
}) {
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const set = (patch) => onChange?.({ ...value, ...patch });

  const pickCity = (name) => {
    const c = NIGERIAN_CITIES.find((x) => x.city === name);
    set(c ? { city: c.city, state: c.state, lat: c.lat, lng: c.lng } : { city: name });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Your browser can't share location. Drop a pin instead.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        set({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLocating(false);
        setGeoError("We couldn't get your location. Drop a pin on the map instead.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const hasPin = value.lat != null && value.lng != null;
  const cityCentre = NIGERIAN_CITIES.find((c) => c.city === value.city) ?? NIGERIAN_CITIES[0];

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-ink">{label}</legend>
      <Input
        label="Street address"
        placeholder="12 Herbert Macaulay Way"
        value={value.line1 ?? ''}
        error={errors.line1}
        onChange={(e) => set({ line1: e.target.value })}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Area"
          placeholder="Yaba"
          value={value.area ?? ''}
          error={errors.area}
          onChange={(e) => set({ area: e.target.value })}
        />
        <Select
          label="City"
          placeholder="Pick a city"
          value={value.city ?? ''}
          error={errors.city}
          options={NIGERIAN_CITIES.map((c) => ({ value: c.city, label: c.city }))}
          onValueChange={pickCity}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-ink-muted">
            {hasPin ? 'Pin set. Tap the map to move it.' : 'Tap the map to drop a pin.'}
          </p>
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<LocateFixed className="h-4 w-4" />}
            loading={locating}
            onClick={useMyLocation}
          >
            Use my location
          </Button>
        </div>
        <MapView
          height={mapHeight}
          label="Pick the delivery location"
          center={hasPin ? { lat: value.lat, lng: value.lng } : cityCentre}
          markers={
            hasPin
              ? [
                  {
                    id: 'pin',
                    kind: 'customer',
                    label: 'Delivery pin',
                    position: { lat: value.lat, lng: value.lng },
                  },
                ]
              : []
          }
          onMapClick={(p) => set({ lat: p.lat, lng: p.lng })}
        />
        {(geoError || errors.pin) && (
          <p className="text-sm text-danger" role="alert">
            {geoError ?? errors.pin}
          </p>
        )}
      </div>
    </fieldset>
  );
}
