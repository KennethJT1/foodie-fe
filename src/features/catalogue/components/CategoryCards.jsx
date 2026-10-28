import { Skeleton } from '@/components/feedback';
import { cn } from '@/lib/cn';
import { formatCount } from '@/lib/format';

import { useCategories } from '../hooks/useCatalogue';

/** "Popular categories" cards (UI kit): big picture on top, name and count below. */
export function CategoryCards({ value, onChange, className }) {
  const { data, isLoading, isError } = useCategories();
  if (isError) return null;
  const cats = data?.data ?? [];

  return (
    <div
      className={cn(
        '-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-6 md:px-0',
        className,
      )}
    >
      {isLoading
        ? Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-32 w-28 shrink-0 rounded-card md:w-auto" />
          ))
        : cats.slice(0, 12).map((c) => {
            const on = value === c.id;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                onClick={() => onChange(on ? null : c.id)}
                className={cn(
                  'flex w-28 shrink-0 flex-col overflow-hidden rounded-card text-left shadow-card transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink md:w-auto',
                  on ? 'ring-2 ring-primary' : '',
                )}
              >
                <span
                  className="flex h-20 items-center justify-center bg-surface text-4xl"
                  aria-hidden="true"
                >
                  {c.icon}
                </span>
                <span className={cn('px-3 py-2', on ? 'bg-primary' : 'bg-surface-muted')}>
                  <span className="line-clamp-1 text-sm font-semibold text-ink">{c.name}</span>
                  {c.itemCount != null && (
                    <span className={cn('block text-xs', on ? 'text-ink' : 'text-primary-700')}>
                      {formatCount(c.itemCount)} dishes
                    </span>
                  )}
                </span>
              </button>
            );
          })}
    </div>
  );
}
