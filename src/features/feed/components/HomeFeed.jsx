import { Store, UtensilsCrossed } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import { InfiniteList } from '@/components/data';
import { EmptyState } from '@/components/feedback';
import { Button, Tabs } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { useSession } from '@/features/auth';
import { CategoryChips } from '@/features/catalogue';

import { FoodPost, FoodPostSkeleton } from './FoodPost';
import { useFeed } from '../hooks/useFeed';

const TABS = [
  { value: 'nearby', label: 'Near you' },
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'following', label: 'Following' },
];

/** Home feed of food posts near the customer (FR-SOC-01). Tab and category live in the URL. */
export function HomeFeed() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useSession();
  const tab = TABS.some((t) => t.value === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'nearby';
  const categoryId = searchParams.get('category') || undefined;
  const needsLogin = tab === 'following' && !isAuthenticated;
  const query = useFeed({ tab, ...(categoryId ? { categoryId } : {}) }, { enabled: !needsLogin });

  const setParam = (key, value) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Tabs
        items={TABS}
        value={tab}
        onChange={(v) => setParam('tab', v === 'nearby' ? null : v)}
        aria-label="Feed"
      />
      <CategoryChips value={categoryId} onChange={(v) => setParam('category', v)} />
      {needsLogin ? (
        <EmptyState
          icon={Store}
          title="Log in to see who you follow"
          message="Follow your favourite vendors and their new dishes show up here."
          action={
            <Button asChild>
              <Link to={`${ROUTES.login}?next=${encodeURIComponent('/?tab=following')}`}>
                Log in
              </Link>
            </Button>
          }
        />
      ) : (
        <InfiniteList
          query={query}
          className="space-y-4"
          renderItem={(item) => <FoodPost item={item} />}
          loadingFallback={
            <div role="status" aria-label="Loading food" className="space-y-4">
              <FoodPostSkeleton />
              <FoodPostSkeleton />
            </div>
          }
          emptyState={
            tab === 'following' ? (
              <EmptyState
                icon={Store}
                title="No posts from vendors you follow"
                message="Follow a vendor from their store page to see their new dishes here."
                action={
                  <Button asChild variant="outline">
                    <Link to={ROUTES.search}>Find vendors</Link>
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={UtensilsCrossed}
                title="No food here yet"
                message="Try another category, or search for something you fancy."
                action={
                  <Button asChild variant="outline">
                    <Link to={ROUTES.search}>Search food</Link>
                  </Button>
                }
              />
            )
          }
        />
      )}
    </div>
  );
}
