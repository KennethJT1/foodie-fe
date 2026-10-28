import { useEffect, useRef } from 'react';

import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

/**
 * Renders pages from useInfiniteQuery. Loads the next page when the end scrolls into view,
 * with a "Load more" button as a fallback.
 */
export function InfiniteList({
  query,
  renderItem,
  getKey = (item) => item.id,
  loadingFallback,
  emptyState,
  className,
  as: Tag = 'ul',
  itemClassName,
  autoLoad = true,
}) {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = query;
  const sentinel = useRef(null);
  const items = data?.pages.flatMap((p) => p.data) ?? [];

  useEffect(() => {
    if (!autoLoad || !hasNextPage || !sentinel.current) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: '400px' },
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [autoLoad, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return loadingFallback ?? null;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (items.length === 0) return emptyState ?? <EmptyState title="Nothing here yet" />;

  return (
    <>
      <Tag className={className}>
        {items.map((item, i) => (
          <li key={getKey(item)} className={cn(itemClassName)}>
            {renderItem(item, i)}
          </li>
        ))}
      </Tag>
      <div ref={sentinel} aria-hidden="true" />
      {hasNextPage && (
        <div className="flex justify-center py-4">
          <Button variant="outline" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
            Load more
          </Button>
        </div>
      )}
    </>
  );
}
