import { Store, UtensilsCrossed } from 'lucide-react';
import { useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { Pagination } from '@/components/data';
import { EmptyState, ErrorState } from '@/components/feedback';
import { Button, Tabs } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { useSession } from '@/features/auth';
import { CategoryCards } from '@/features/catalogue';
import { PopularVendors } from '@/features/vendors';

import { FoodPost, FoodPostSkeleton } from './FoodPost';
import { HomeHero } from './HomeHero';
import { useFeed } from '../hooks/useFeed';

const TABS = [
  { value: 'nearby', label: 'Near you' },
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'following', label: 'Following' },
];

const GRID = 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3';

/**
 * Home feed of food posts near the customer (FR-SOC-01), one numbered page at a time.
 * Tab, category and page live in the URL.
 */
export function HomeFeed() {
  const [searchParams, setSearchParams] = useSearchParams();
  const feedTop = useRef(null);
  const { isAuthenticated } = useSession();
  const tab = TABS.some((t) => t.value === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'nearby';
  const categoryId = searchParams.get('category') || undefined;
  const needsLogin = tab === 'following' && !isAuthenticated;
  const page = Math.max(Math.floor(Number(searchParams.get('page'))) || 1, 1);
  const query = useFeed(
    { tab, ...(categoryId ? { categoryId } : {}), page },
    { enabled: !needsLogin },
  );

  // A new tab or category starts again at page 1
  const setParam = (key, value) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== 'page') next.delete('page');
        return next;
      },
      { replace: true },
    );

  const goToPage = (p) => {
    setParam('page', p > 1 ? String(p) : null);
    feedTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const { data, isLoading, isError, error, refetch, isPlaceholderData } = query;
  const items = (Array.isArray(data?.data) ? data.data : []).filter(Boolean);

  return (
    <div className="space-y-10">
      <HomeHero />
      <section aria-labelledby="popular-categories" className="space-y-4">
        <h2 id="popular-categories" className="text-xl font-bold md:text-2xl">
          Popular categories <span aria-hidden="true">🤩</span>
        </h2>
        <CategoryCards value={categoryId} onChange={(v) => setParam('category', v)} />
      </section>
      <PopularVendors />
      <section ref={feedTop} aria-labelledby="feed-heading" className="scroll-mt-20 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 id="feed-heading" className="text-xl font-bold md:text-2xl">
            Fresh from the kitchen
          </h2>
          <Tabs
            variant="pills"
            items={TABS}
            value={tab}
            onChange={(v) => setParam('tab', v === 'nearby' ? null : v)}
            aria-label="Feed"
          />
        </div>
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
        ) : isLoading ? (
          <div role="status" aria-label="Loading food" className={GRID}>
            <FoodPostSkeleton />
            <FoodPostSkeleton />
            <FoodPostSkeleton />
          </div>
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : items.length === 0 ? (
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
        ) : (
          <>
            <ul
              className={GRID}
              aria-busy={isPlaceholderData || undefined}
              style={isPlaceholderData ? { opacity: 0.6 } : undefined}
            >
              {items.map((item, i) => (
                <li key={item.id ?? i}>
                  <FoodPost item={item} />
                </li>
              ))}
            </ul>
            {data?.meta?.totalPages > 1 && <Pagination meta={data.meta} onPageChange={goToPage} />}
          </>
        )}
      </section>
    </div>
  );
}
