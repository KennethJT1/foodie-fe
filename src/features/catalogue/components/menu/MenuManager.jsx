import { Plus, UtensilsCrossed } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { DataTable, FilterBar, PageHeader, Pagination } from '@/components/data';
import { EmptyState, toast } from '@/components/feedback';
import { Badge, Button, Switch } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { useTableQuery } from '@/hooks/useTableQuery';
import { formatNaira } from '@/lib/format';

import { useCategories } from '../../hooks/useCatalogue';
import { useToggleSoldOut, useVendorMenu } from '../../hooks/useVendorMenu';
import { FoodImage } from '../FoodImage';

const AVAILABILITY = [
  { value: 'available', label: 'On sale' },
  { value: 'sold_out', label: 'Sold out' },
];

/** The vendor's menu: filters, sold-out switch and the plan's item limit. */
export function MenuManager() {
  const table = useTableQuery({ defaults: { limit: 20, sort: 'name' } });
  const { data, isLoading, error, refetch } = useVendorMenu(table.params);
  const categories = useCategories();
  const toggle = useToggleSoldOut();
  const navigate = useNavigate();
  const limits = data?.meta?.limits;
  const isFull = limits?.menuItems != null && limits.used >= limits.menuItems;

  const columns = [
    {
      key: 'name',
      header: 'Item',
      primary: true,
      sortable: true,
      cell: (f) => (
        <div className="flex items-center gap-3">
          <FoodImage src={f.photos[0]} alt={f.name} className="h-12 w-12 shrink-0 rounded-lg" />
          <div className="min-w-0">
            <Link
              to={ROUTES.vendor.menuEdit(f.id)}
              className="font-medium hover:text-primary-700 hover:underline"
            >
              {f.name}
            </Link>
            <p className="text-xs text-ink-muted">{f.categoryName}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      align: 'right',
      cell: (f) => formatNaira(f.price),
    },
    { key: 'ordersCount', header: 'Orders', sortable: true, align: 'right', hideOnMobile: true },
    {
      key: 'isAvailable',
      header: 'On sale',
      cell: (f) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={f.isAvailable}
            label={<span className="sr-only">{f.name} on sale</span>}
            onChange={(isAvailable) =>
              toggle.mutate(
                { id: f.id, isAvailable },
                {
                  onSuccess: () =>
                    toast.success(
                      isAvailable ? `${f.name} is back on sale` : `${f.name} marked sold out`,
                    ),
                  onError: (e) => toast.error(e),
                },
              )
            }
          />
          {!f.isAvailable && <Badge tone="danger">Sold out</Badge>}
          {f.isHidden && <Badge tone="warning">Hidden by KJT Foodie</Badge>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Menu"
        description={
          limits
            ? `${limits.used} of ${limits.menuItems ?? 'unlimited'} items on your ${limits.planName} plan · ${limits.photosPerItem} photo${limits.photosPerItem > 1 ? 's' : ''} per item`
            : 'Your dishes, prices and what is on sale today.'
        }
        actions={
          isFull ? (
            <Button asChild variant="outline">
              <Link to={ROUTES.vendor.plans}>Upgrade to add more</Link>
            </Button>
          ) : (
            <Button asChild leftIcon={<Plus className="h-4 w-4" />}>
              <Link to={ROUTES.vendor.menuNew}>Add new item</Link>
            </Button>
          )
        }
      />
      <FilterBar
        value={table.filters}
        onChange={table.setFilters}
        fields={[
          { type: 'search', name: 'search', placeholder: 'Search your menu' },
          {
            type: 'select',
            name: 'categoryId',
            label: 'Category',
            options: (categories.data?.data ?? []).map((c) => ({ value: c.id, label: c.name })),
          },
          { type: 'select', name: 'availability', label: 'Availability', options: AVAILABILITY },
        ]}
      />
      <DataTable
        caption="Menu items"
        columns={columns}
        rows={data?.data}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        sort={table.sort}
        onSortChange={table.setSort}
        rowActions={(f) => [
          { label: 'Edit item', onSelect: () => navigate(ROUTES.vendor.menuEdit(f.id)) },
        ]}
        emptyState={
          <EmptyState
            icon={UtensilsCrossed}
            title={
              Object.keys(table.filters).length
                ? 'No items match these filters'
                : 'Your menu is empty'
            }
            message="Add your first dish so customers can order it."
            action={
              <Button asChild>
                <Link to={ROUTES.vendor.menuNew}>Add new item</Link>
              </Button>
            }
          />
        }
      />
      <Pagination meta={data?.meta} onPageChange={table.setPage} onLimitChange={table.setLimit} />
    </div>
  );
}
