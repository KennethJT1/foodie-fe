import { BadgeCheck } from 'lucide-react';
import { useState } from 'react';

import { Input, Select, Spinner } from '@/components/ui';
import { useDebounce } from '@/hooks/useDebounce';

import { StepCard } from './StepCard';
import { useBanks, useResolveAccount, useSaveOnboardingStep } from '../../hooks/useOnboarding';

/** Settlement account: the name is looked up from the bank before it can be saved (BR-PAY-02). */
export function BankStep({ data, onNext, onBack }) {
  const [bankCode, setBankCode] = useState(data.bank?.bankCode ?? '');
  const [accountNumber, setAccountNumber] = useState(data.bank?.accountNumber ?? '');
  const [saveError, setSaveError] = useState(null);
  const banks = useBanks();
  const typedNumber = useDebounce(accountNumber, 300);
  const resolved = useResolveAccount({ bankCode, accountNumber: typedNumber });
  const save = useSaveOnboardingStep();
  const isComplete = /^\d{10}$/.test(accountNumber);
  const isReady = isComplete && typedNumber === accountNumber && resolved.isSuccess;

  const numberError =
    saveError ??
    (resolved.isError
      ? (resolved.error.fieldErrors?.accountNumber ??
        resolved.error.fieldErrors?.bankCode ??
        resolved.error.message)
      : null);

  const submit = () =>
    save.mutate(
      { step: 'bank', bankCode, accountNumber },
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
      <div className="space-y-4">
        <Select
          label="Bank"
          placeholder={banks.isLoading ? 'Loading banks' : 'Pick your bank'}
          disabled={banks.isLoading}
          options={(banks.data ?? []).map((b) => ({ value: b.code, label: b.name }))}
          value={bankCode}
          error={banks.isError ? "We couldn't load the banks. Refresh to try again." : undefined}
          onValueChange={(value) => {
            setBankCode(value);
            setSaveError(null);
          }}
        />
        <Input
          label="Account number"
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          placeholder="0123456789"
          value={accountNumber}
          error={numberError}
          onChange={(e) => {
            setAccountNumber(e.target.value.replace(/\D/g, ''));
            setSaveError(null);
          }}
        />
        <div aria-live="polite">
          {resolved.isFetching && (
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <Spinner label="Checking account" /> Checking the account name
            </p>
          )}
          {isReady && (
            <p className="flex items-center gap-2 rounded-lg bg-secondary-50 p-3 text-sm text-secondary-600">
              <BadgeCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>
                Account name: <strong className="font-semibold">{resolved.data.accountName}</strong>
              </span>
            </p>
          )}
        </div>
        <p className="text-xs text-ink-muted">
          Changing this account later needs a fresh check and approval by our team.
        </p>
      </div>
    </StepCard>
  );
}
