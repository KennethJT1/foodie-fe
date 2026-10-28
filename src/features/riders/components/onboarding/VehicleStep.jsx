import { useState } from 'react';

import { StepCard } from '@/components/forms';
import { Input, RadioGroup } from '@/components/ui';

import { VEHICLE_OPTIONS } from '../../constants';
import { useSaveRiderStep } from '../../hooks/useRiderOnboarding';

export function VehicleStep({ data, onNext }) {
  const [value, setValue] = useState({
    vehicleType: data.vehicleType ?? '',
    plateNumber: data.plateNumber ?? '',
    licenceNumber: data.licenceNumber ?? '',
  });
  const [errors, setErrors] = useState({});
  const save = useSaveRiderStep();
  const set = (patch) => setValue((v) => ({ ...v, ...patch }));

  return (
    <StepCard
      title="Your vehicle and licence"
      description="We match jobs to what you ride."
      isSaving={save.isPending}
      onContinue={() =>
        save.mutate(
          { step: 'vehicle', ...value },
          { onSuccess: onNext, onError: (e) => setErrors(e.fieldErrors ?? {}) },
        )
      }
    >
      <div className="space-y-4">
        <RadioGroup
          label="What do you ride?"
          variant="cards"
          options={VEHICLE_OPTIONS}
          value={value.vehicleType}
          error={errors.vehicleType}
          onChange={(vehicleType) => set({ vehicleType })}
        />
        {value.vehicleType !== 'bicycle' && (
          <Input
            label="Plate number"
            placeholder="LSR-123AB"
            autoCapitalize="characters"
            value={value.plateNumber}
            error={errors.plateNumber}
            onChange={(e) => set({ plateNumber: e.target.value })}
          />
        )}
        <Input
          label="Licence number"
          autoCapitalize="characters"
          value={value.licenceNumber}
          error={errors.licenceNumber}
          onChange={(e) => set({ licenceNumber: e.target.value })}
        />
      </div>
    </StepCard>
  );
}
