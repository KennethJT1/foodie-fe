import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Pagination } from '@/components/data';
import { EmptyState, ErrorState, SkeletonCards } from '@/components/feedback';
import { Button } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { FoodCard } from '@/features/catalogue';
import { useTableQuery } from '@/hooks/useTableQuery';

import { LikeButton } from './LikeButton';
import { useLikedItems } from '../hooks/useFeed';

/** Food the customer has liked, newest like first. */
export function LikedFoodList() {
  const table = useTableQuery({ defaults: { limit: 12 } });
  const { data, isLoading, isError, error, refetch } = useLikedItems(table.params);

  if (isLoading) return <SkeletonCards count={6} />;
  if (isError)
    return <ErrorState title="We couldn't load your liked food" error={error} onRetry={refetch} />;
  if (!data.data.length) {
    return (
      <EmptyState
        icon={Heart}
        title="No liked food yet"
        message="Tap the heart on any dish to save it here for later."
        action={
          <Button asChild>
            <Link to={ROUTES.home}>Browse food</Link>
          </Button>
        }
      />
    );
  }
  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {data.data.map((item) => (
          <li key={item.id} className="space-y-1">
            <FoodCard item={item} />
            <LikeButton item={item} />
          </li>
        ))}
      </ul>
      <Pagination
        meta={data.meta}
        limits={[12, 24, 48]}
        onPageChange={table.setPage}
        onLimitChange={table.setLimit}
      />
    </>
  );
}
