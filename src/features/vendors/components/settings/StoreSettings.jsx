import { PageHeader } from '@/components/data';
import { ErrorState, Skeleton } from '@/components/feedback';

import { BankAccountCard } from './BankAccountCard';
import { OpeningHoursEditor } from './OpeningHoursEditor';
import { StaffAccounts } from './StaffAccounts';
import { StoreBasics } from './StoreBasics';
import { useStoreSettings } from '../../hooks/useStore';

/** Store settings: orders and delivery, opening hours, bank account and staff. */
export function StoreSettings() {
  const { data, isLoading, isError, error, refetch } = useStoreSettings();
  return (
    <div className="space-y-4">
      <PageHeader title="Store settings" description="How and when customers can order from you." />
      {isLoading ? (
        <div role="status" aria-label="Loading settings" className="grid gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 rounded-card" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState title="We couldn't load your settings" error={error} onRetry={refetch} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          <div className="space-y-4">
            <StoreBasics store={data} />
            <BankAccountCard store={data} />
            <StaffAccounts />
          </div>
          <OpeningHoursEditor hours={data.openingHours} />
        </div>
      )}
    </div>
  );
}
