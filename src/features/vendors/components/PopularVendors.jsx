import { Link } from 'react-router-dom';

import { Skeleton } from '@/components/feedback';
import { ROUTES } from '@/constants/routes';

import { useVendorList } from '../hooks/useVendors';

/** "Popular vendors" row of orange tiles with logos (UI kit). Hides itself on error. */
export function PopularVendors() {
  const { data, isLoading, isError } = useVendorList({ sort: '-rating', limit: 6 });
  if (isError || (!isLoading && !data?.data?.length)) return null;

  return (
    <section aria-labelledby="popular-vendors" className="space-y-4">
      <h2 id="popular-vendors" className="text-xl font-bold md:text-2xl">
        Popular vendors
      </h2>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {isLoading
          ? Array.from({ length: 6 }, (_, i) => (
              <li key={i}>
                <Skeleton className="aspect-[4/5] w-full rounded-card" />
              </li>
            ))
          : data.data.map((v) => (
              <li key={v.id}>
                <Link
                  to={ROUTES.storefront(v.slug)}
                  className="group flex aspect-[4/5] flex-col overflow-hidden rounded-card bg-primary shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                >
                  <span className="flex flex-1 items-center justify-center bg-surface-muted p-3">
                    {v.logo ? (
                      <img
                        src={v.logo}
                        alt=""
                        className="h-16 w-16 rounded-xl object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <span className="text-3xl" aria-hidden="true">
                        🍲
                      </span>
                    )}
                  </span>
                  <span className="line-clamp-2 px-2 py-2 text-center text-xs font-semibold text-ink">
                    {v.name}
                  </span>
                </Link>
              </li>
            ))}
      </ul>
    </section>
  );
}
