import { UtensilsCrossed } from 'lucide-react';
import { useEffect, useState } from 'react';

import { EmptyState, ErrorState, SkeletonCards } from '@/components/feedback';
import { useFoodItems } from '@/features/catalogue';
import { cn } from '@/lib/cn';

import { MenuItemCard } from './MenuItemCard';

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

/** The vendor's menu grouped by category, with a sticky orange category strip (UI kit). */
export function StorefrontMenu({ vendor }) {
  const { data, isLoading, isError, error, refetch } = useFoodItems({
    vendorId: vendor.id,
    limit: 100,
    sort: 'categoryName,name',
  });
  const [active, setActive] = useState(null);

  const sections = [];
  for (const item of data?.data ?? []) {
    const name = item.categoryName ?? 'Other';
    let section = sections.find((s) => s.name === name);
    if (!section) sections.push((section = { name, items: [] }));
    section.items.push(item);
  }
  const sectionKey = sections.map((s) => s.name).join('|');

  // Highlight the section in view
  useEffect(() => {
    if (!sectionKey) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-140px 0px -55% 0px' },
    );
    sectionKey.split('|').forEach((n) => {
      const el = document.getElementById(`menu-${slug(n)}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sectionKey]);

  if (isLoading) return <SkeletonCards count={6} />;
  if (isError)
    return <ErrorState title="We couldn't load the menu" error={error} onRetry={refetch} />;
  if (!sections.length) {
    return (
      <EmptyState
        icon={UtensilsCrossed}
        title="No dishes on the menu yet"
        message="Follow this vendor to see new dishes as soon as they post them."
      />
    );
  }

  const current = active ?? `menu-${slug(sections[0].name)}`;

  return (
    <div className="space-y-8">
      {sections.length > 1 && (
        <nav
          aria-label="Menu sections"
          className="sticky top-16 z-20 -mx-4 bg-surface/95 px-4 py-2 backdrop-blur md:top-20 md:mx-0 md:px-0"
        >
          <ul className="flex gap-1 overflow-x-auto rounded-full bg-primary p-1.5">
            {sections.map((s) => {
              const id = `menu-${slug(s.name)}`;
              const on = current === id;
              return (
                <li key={s.name} className="shrink-0">
                  <a
                    href={`#${id}`}
                    aria-current={on ? 'true' : undefined}
                    className={cn(
                      'inline-flex min-h-[40px] items-center rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink',
                      on ? 'bg-ink text-white' : 'text-ink hover:bg-white/40',
                    )}
                  >
                    {s.name}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
      {sections.map((s) => (
        <section
          key={s.name}
          id={`menu-${slug(s.name)}`}
          aria-labelledby={`menu-${slug(s.name)}-h`}
          className="scroll-mt-40"
        >
          <h3
            id={`menu-${slug(s.name)}-h`}
            className="mb-4 text-xl font-bold text-primary-700 md:text-2xl"
          >
            {s.name}
          </h3>
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {s.items.map((item) => (
              <li key={item.id}>
                <MenuItemCard item={item} vendor={vendor} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
