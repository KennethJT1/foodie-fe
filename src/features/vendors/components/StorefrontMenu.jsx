import { UtensilsCrossed } from 'lucide-react';

import { EmptyState, ErrorState, SkeletonCards } from '@/components/feedback';
import { FoodCard, useFoodItems } from '@/features/catalogue';

/** The vendor's menu grouped by category. */
export function StorefrontMenu({ vendorId }) {
  const { data, isLoading, isError, error, refetch } = useFoodItems({
    vendorId,
    limit: 100,
    sort: 'categoryName,name',
  });

  if (isLoading) return <SkeletonCards count={6} />;
  if (isError)
    return <ErrorState title="We couldn't load the menu" error={error} onRetry={refetch} />;
  if (!data.data.length) {
    return (
      <EmptyState
        icon={UtensilsCrossed}
        title="No dishes on the menu yet"
        message="Follow this vendor to see new dishes as soon as they post them."
      />
    );
  }

  const sections = [];
  for (const item of data.data) {
    const name = item.categoryName ?? 'Other';
    let section = sections.find((s) => s.name === name);
    if (!section) sections.push((section = { name, items: [] }));
    section.items.push(item);
  }

  return (
    <div className="space-y-6">
      {sections.length > 1 && (
        <nav
          aria-label="Menu sections"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0"
        >
          {sections.map((s) => (
            <a
              key={s.name}
              href={`#menu-${slug(s.name)}`}
              className="inline-flex min-h-[36px] shrink-0 items-center rounded-full border border-surface-border bg-surface px-3 text-sm font-medium hover:border-primary-600"
            >
              {s.name}
            </a>
          ))}
        </nav>
      )}
      {sections.map((s) => (
        <section
          key={s.name}
          id={`menu-${slug(s.name)}`}
          aria-labelledby={`menu-${slug(s.name)}-h`}
        >
          <h3 id={`menu-${slug(s.name)}-h`} className="mb-3 text-base font-semibold">
            {s.name}
          </h3>
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {s.items.map((item) => (
              <li key={item.id}>
                <FoodCard item={item} showVendor={false} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
