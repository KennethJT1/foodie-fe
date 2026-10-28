import { useState } from 'react';

import { PhoneInput, StepCard } from '@/components/forms';
import { Input } from '@/components/ui';

import { useSaveRiderStep } from '../../hooks/useRiderOnboarding';

const fieldErrors = (e) =>
  Object.fromEntries(
    Object.entries(e.fieldErrors ?? {}).map(([k, m]) => [k.replace(/^guarantor\./, ''), m]),
  );

export function GuarantorStep({ data, onNext, onBack }) {
  const [g, setG] = useState(() => ({
    name: data.guarantor?.name ?? '',
    phone: data.guarantor?.phone?.replace(/^\+234/, '0') ?? '',
    relationship: data.guarantor?.relationship ?? '',
    address: data.guarantor?.address ?? '',
  }));
  const [errors, setErrors] = useState({});
  const save = useSaveRiderStep();
  const set = (patch) => setG((v) => ({ ...v, ...patch }));

  return (
    <StepCard
      title="Your guarantor"
      description="Someone who knows you well and can vouch for you. We may call them."
      onBack={onBack}
      isSaving={save.isPending}
      onContinue={() =>
        save.mutate(
          { step: 'guarantor', guarantor: g },
          { onSuccess: onNext, onError: (e) => setErrors(fieldErrors(e)) },
        )
      }
    >
      <div className="space-y-4">
        <Input
          label="Full name"
          value={g.name}
          error={errors.name}
          onChange={(e) => set({ name: e.target.value })}
        />
        <PhoneInput
          label="Phone number"
          value={g.phone}
          error={errors.phone}
          onChange={(phone) => set({ phone })}
        />
        <Input
          label="How do you know them?"
          placeholder="Uncle, employer, pastor…"
          value={g.relationship}
          error={errors.relationship}
          onChange={(e) => set({ relationship: e.target.value })}
        />
        <Input
          label="Home address"
          value={g.address}
          error={errors.address}
          onChange={(e) => set({ address: e.target.value })}
        />
      </div>
    </StepCard>
  );
}
