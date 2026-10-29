import { SearchX } from 'lucide-react';

import { FilterBar, Pagination } from '@/components/data';
import { EmptyState, ErrorState, SkeletonCards } from '@/components/feedback';
import { Button, Select } from '@/components/ui';
import { useTableQuery } from '@/hooks/useTableQuery';

import { FoodCard } from './FoodCard';
import { useCategories, useFoodItems } from '../hooks/useCatalogue';

const PRICE_OPTIONS = [
  { value: '0-200000', label: 'Under ₦2,000' },
  { value: '200000-500000', label: '₦2,000 – ₦5,000' },
  { value: '500000-1000000', label: '₦5,000 – ₦10,000' },
  { value: '1000000-', label: 'Over ₦10,000' },
];
const DISTANCE_OPTIONS = [2, 5, 10, 20].map((km) => ({
  value: String(km),
  label: `Within ${km} km`,
}));
const RATING_OPTIONS = [
  { value: '4.5', label: '4.5 stars and up' },
  { value: '4', label: '4 stars and up' },
  { value: '3.5', label: '3.5 stars and up' },
];
const SORT_OPTIONS = [
  { value: '-likesCount', label: 'Most popular' },
  { value: 'distanceM', label: 'Nearest' },
  { value: '-vendor.rating', label: 'Top rated' },
  { value: 'price', label: 'Price: low to high' },
  { value: '-price', label: 'Price: high to low' },
  { value: '-createdAt', label: 'Newest' },
];

/** Turns URL filters into API params (price range → minPrice / maxPrice in kobo). */
export function toSearchParams({ price, ...params }) {
  if (!price) return params;
  const [min, max] = String(price).split('-');
  return { ...params, ...(min ? { minPrice: min } : {}), ...(max ? { maxPrice: max } : {}) };
}

/** Search and filter food by name, vendor, category, price, distance and rating (FR-SOC-02). */
export function FoodSearch() {
  const table = useTableQuery({ defaults: { limit: 12, sort: '-likesCount' } });
  const categories = useCategories();
  const query = useFoodItems(toSearchParams(table.params));
  const rows = query.data?.data ?? [];

  const categoryOptions = (categories.data?.data ?? []).map((c) => ({
    value: c.id,
    label: c.name,
    icon: c.icon,
  }));

  return (
    <div className="space-y-4">
      <FilterBar
        value={table.filters}
        onChange={table.setFilters}
        fields={[
          {
            type: 'search',
            name: 'search',
            label: 'Search food',
            placeholder: 'Jollof, suya, a vendor…',
          },
          {
            type: 'select',
            name: 'price',
            label: 'Price',
            options: PRICE_OPTIONS,
            placeholder: 'Any price',
          },
          {
            type: 'select',
            name: 'maxDistanceKm',
            label: 'Distance',
            options: DISTANCE_OPTIONS,
            placeholder: 'Any distance',
          },
          {
            type: 'select',
            name: 'minRating',
            label: 'Rating',
            options: RATING_OPTIONS,
            placeholder: 'Any rating',
          },
          {
            type: 'chips',
            name: 'categoryId',
            label: 'Categories',
            options: categoryOptions,
            multiple: false,
          },
        ]}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-muted" aria-live="polite">
          {query.data ? `${query.data.meta.total} dishes` : ' '}
        </p>
        <Select
          label="Sort by"
          labelHidden
          className="w-48"
          options={SORT_OPTIONS}
          value={table.sort ?? '-likesCount'}
          onValueChange={table.setSort}
        />
      </div>

      {query.isLoading ? (
        <SkeletonCards count={6} />
      ) : query.isError ? (
        <ErrorState title="We couldn't load dishes" error={query.error} onRetry={query.refetch} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No dishes match that"
          message="Try another name, or clear some filters to see more food near you."
          action={
            <Button variant="outline" onClick={table.reset}>
              Clear search
            </Button>
          }
        />
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {rows.map((item) => (
              <li key={item.id}>
                <FoodCard item={item} />
              </li>
            ))}
          </ul>
          <Pagination
            meta={query.data.meta}
            limits={[12, 24, 48]}
            onPageChange={table.setPage}
            onLimitChange={table.setLimit}
          />
        </>
      )}
    </div>
  );
}
