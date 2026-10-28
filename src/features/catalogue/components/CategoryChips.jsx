import { Skeleton } from '@/components/feedback';
import { cn } from '@/lib/cn';

import { useCategories } from '../hooks/useCatalogue';

/** Horizontal category filter. `value` is a category id or empty for all. */
export function CategoryChips({ value, onChange, className }) {
  const { data, isLoading, isError } = useCategories();
  if (isError) return null; // the feed below still works without the chips
  const chips = [{ id: '', name: 'All', icon: '🍽️' }, ...(data?.data ?? [])];

  return (
    <div
      role="group"
      aria-label="Categories"
      className={cn('-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0', className)}
    >
      {isLoading
        ? Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />
          ))
        : chips.map((c) => {
            const on = (value ?? '') === c.id;
            return (
              <button
                key={c.id || 'all'}
                type="button"
                aria-pressed={on}
                onClick={() => onChange(c.id || null)}
                className={cn(
                  'inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
                  on
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-surface-border bg-surface text-ink hover:border-primary-600',
                )}
              >
                <span aria-hidden="true">{c.icon}</span>
                {c.name}
              </button>
            );
          })}
    </div>
  );
}
