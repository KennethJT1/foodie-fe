import { useState } from 'react';

import { StepCard } from '@/components/forms';
import { BankAccountFields, useAccountCheck } from '@/features/payments';

import { useSaveRiderStep } from '../../hooks/useRiderOnboarding';

export function RiderBankStep({ data, onNext, onBack }) {
  const [value, setValue] = useState({
    bankCode: data.bank?.bankCode ?? '',
    accountNumber: data.bank?.accountNumber ?? '',
  });
  const [error, setError] = useState(null);
  const { isReady } = useAccountCheck(value);
  const save = useSaveRiderStep();
  return (
    <StepCard
      title="Where should we pay you?"
      description="Your monthly earnings go to this account."
      onBack={onBack}
      isSaving={save.isPending}
      canContinue={isReady}
      onContinue={() =>
        save.mutate(
          { step: 'bank', ...value },
          {
            onSuccess: onNext,
            onError: (e) => setError(e.fieldErrors?.accountNumber ?? e.message),
          },
        )
      }
    >
      <BankAccountFields
        value={value}
        error={error}
        onChange={(v) => {
          setValue(v);
          setError(null);
        }}
      />
    </StepCard>
  );
}
