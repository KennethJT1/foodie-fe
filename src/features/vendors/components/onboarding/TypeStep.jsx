import { useState } from 'react';

import { StepCard } from '@/components/forms';
import { RadioGroup } from '@/components/ui';

import { useSaveOnboardingStep } from '../../hooks/useOnboarding';

const TYPES = [
  {
    value: 'restaurant',
    label: 'Registered restaurant',
    description: 'You have a CAC certificate and a food-handling permit.',
  },
  {
    value: 'home_cook',
    label: 'Home cook',
    description: 'You cook from home. You only need a government ID.',
  },
];

export function TypeStep({ data, onNext }) {
  const [type, setType] = useState(data.type ?? '');
  const [error, setError] = useState(null);
  const save = useSaveOnboardingStep();

  const submit = () => {
    if (!type) return setError('Pick what kind of vendor you are');
    save.mutate(
      { step: 'type', type },
      { onSuccess: onNext, onError: (e) => setError(e.fieldErrors?.type ?? e.message) },
    );
  };

  return (
    <StepCard
      title="What kind of vendor are you?"
      description="This decides which documents we ask for."
      onContinue={submit}
      isSaving={save.isPending}
    >
      <RadioGroup
        label="Vendor type"
        variant="cards"
        options={TYPES}
        value={type}
        error={error}
        onChange={(value) => {
          setType(value);
          setError(null);
        }}
      />
    </StepCard>
  );
}
