import { useState } from 'react';

import { StepCard } from './StepCard';
import { useSaveOnboardingStep } from '../../hooks/useOnboarding';
import { BankAccountFields, useAccountCheck } from '../BankAccountFields';

/** Settlement account: the name is looked up from the bank before it can be saved (BR-PAY-02). */
export function BankStep({ data, onNext, onBack }) {
  const [value, setValue] = useState({
    bankCode: data.bank?.bankCode ?? '',
    accountNumber: data.bank?.accountNumber ?? '',
  });
  const [saveError, setSaveError] = useState(null);
  const { isReady } = useAccountCheck(value);
  const save = useSaveOnboardingStep();

  const submit = () =>
    save.mutate(
      { step: 'bank', ...value },
      {
        onSuccess: onNext,
        onError: (e) => setSaveError(e.fieldErrors?.accountNumber ?? e.message),
      },
    );

  return (
    <StepCard
      title="Where should we send your money?"
      description="Customers' payments for your food go straight to this account, paid out the next working day."
      onBack={onBack}
      onContinue={submit}
      isSaving={save.isPending}
      canContinue={isReady}
    >
      <BankAccountFields
        value={value}
        error={saveError}
        onChange={(next) => {
          setValue(next);
          setSaveError(null);
        }}
      />
      <p className="mt-4 text-xs text-ink-muted">
        Changing this account later needs a fresh check and approval by our team.
      </p>
    </StepCard>
  );
}
