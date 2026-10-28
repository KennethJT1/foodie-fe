import { Store } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Pagination } from '@/components/data';
import { EmptyState, ErrorState, Skeleton } from '@/components/feedback';
import { Button } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { useTableQuery } from '@/hooks/useTableQuery';

import { FollowButton } from './FollowButton';
import { VendorCard } from './VendorCard';
import { useFollowedVendors } from '../hooks/useVendors';

/** Vendors the customer follows. */
export function FollowedVendorsList() {
  const table = useTableQuery({ defaults: { limit: 20 } });
  const { data, isLoading, isError, error, refetch } = useFollowedVendors(table.params);

  if (isLoading) {
    return (
      <div role="status" aria-label="Loading vendors" className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-card" />
        ))}
      </div>
    );
  }
  if (isError)
    return <ErrorState title="We couldn't load who you follow" error={error} onRetry={refetch} />;
  if (!data.data.length) {
    return (
      <EmptyState
        icon={Store}
        title="You're not following anyone yet"
        message="Follow vendors from their store page to see their new dishes in your feed."
        action={
          <Button asChild>
            <Link to={ROUTES.search}>Find vendors</Link>
          </Button>
        }
      />
    );
  }
  return (
    <>
      <ul className="grid gap-3 md:grid-cols-2">
        {data.data.map((v) => (
          <li key={v.id}>
            <VendorCard vendor={v} action={<FollowButton vendor={v} size="sm" />} />
          </li>
        ))}
      </ul>
      <Pagination meta={data.meta} onPageChange={table.setPage} onLimitChange={table.setLimit} />
    </>
  );
}
