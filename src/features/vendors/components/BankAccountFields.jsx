import { BadgeCheck } from 'lucide-react';

import { Input, Select, Spinner } from '@/components/ui';
import { useDebounce } from '@/hooks/useDebounce';

import { useBanks, useResolveAccount } from '../hooks/useOnboarding';

/** Resolves the account name for `{ bankCode, accountNumber }`; ready once the bank confirms it. */
export function useAccountCheck({ bankCode, accountNumber }) {
  const typed = useDebounce(accountNumber, 300);
  const resolved = useResolveAccount({ bankCode, accountNumber: typed });
  const isReady = /^\d{10}$/.test(accountNumber) && typed === accountNumber && resolved.isSuccess;
  return { resolved, isReady };
}

/** Bank picker and account number with the account name looked up as you type (BR-PAY-02). */
export function BankAccountFields({ value, onChange, error }) {
  const banks = useBanks();
  const { resolved, isReady } = useAccountCheck(value);
  const lookupError = resolved.isError
    ? (resolved.error.fieldErrors?.accountNumber ??
      resolved.error.fieldErrors?.bankCode ??
      resolved.error.message)
    : null;

  return (
    <div className="space-y-4">
      <Select
        label="Bank"
        placeholder={banks.isLoading ? 'Loading banks' : 'Pick your bank'}
        disabled={banks.isLoading}
        options={(banks.data ?? []).map((b) => ({ value: b.code, label: b.name }))}
        value={value.bankCode}
        error={banks.isError ? "We couldn't load the banks. Refresh to try again." : undefined}
        onValueChange={(bankCode) => onChange({ ...value, bankCode })}
      />
      <Input
        label="Account number"
        inputMode="numeric"
        autoComplete="off"
        maxLength={10}
        placeholder="0123456789"
        value={value.accountNumber}
        error={error ?? lookupError}
        onChange={(e) => onChange({ ...value, accountNumber: e.target.value.replace(/\D/g, '') })}
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
    </div>
  );
}
