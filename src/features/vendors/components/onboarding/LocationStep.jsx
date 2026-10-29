import { useState } from 'react';

import { StepCard } from '@/components/forms';
import { AddressPicker } from '@/components/maps';
import { Select } from '@/components/ui';
import { addressErrors } from '@/features/auth';

import { DELIVERY_RADIUS_OPTIONS, PREP_TIME_OPTIONS } from '../../constants';
import { useSaveOnboardingStep } from '../../hooks/useOnboarding';

/** Server errors arrive as "address.line1"; AddressPicker wants "line1". */
const pickerErrors = (fieldErrors = {}) =>
  Object.fromEntries(Object.entries(fieldErrors).map(([k, m]) => [k.replace(/^address\./, ''), m]));

export function LocationStep({ data, onNext, onBack }) {
  const [place, setPlace] = useState(() => ({
    ...data.address,
    lat: data.lat,
    lng: data.lng,
  }));
  const [radius, setRadius] = useState(String(data.deliveryRadiusKm ?? 8));
  const [prepTime, setPrepTime] = useState(String(data.prepTimeMins ?? 25));
  const [errors, setErrors] = useState({});
  const save = useSaveOnboardingStep();

  const submit = () => {
    const found = addressErrors(place);
    if (found.pin) found.pin = 'Drop a pin where riders pick up food';
    setErrors(found);
    if (Object.keys(found).length) return;
    const { lat, lng, ...address } = place;
    save.mutate(
      {
        step: 'location',
        address,
        lat,
        lng,
        deliveryRadiusKm: Number(radius),
        prepTimeMins: Number(prepTime),
      },
      { onSuccess: onNext, onError: (e) => setErrors(pickerErrors(e.fieldErrors)) },
    );
  };

  return (
    <StepCard
      title="Where do riders pick up your food?"
      description="Customers within your delivery radius can order from you."
      onBack={onBack}
      onContinue={submit}
      isSaving={save.isPending}
    >
      <div className="space-y-4">
        <AddressPicker label="Pickup address" value={place} onChange={setPlace} errors={errors} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Delivery radius"
            options={DELIVERY_RADIUS_OPTIONS}
            value={radius}
            error={errors.deliveryRadiusKm}
            onValueChange={setRadius}
          />
          <Select
            label="Usual preparation time"
            options={PREP_TIME_OPTIONS}
            value={prepTime}
            error={errors.prepTimeMins}
            onValueChange={setPrepTime}
          />
        </div>
      </div>
    </StepCard>
  );
}
