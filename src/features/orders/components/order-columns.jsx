import { Link } from 'react-router-dom';

import { formatDateTime, formatNaira, formatOrderNumber } from '@/lib/format';

import { OrderStatusBadge } from './OrderStatusBadge';

/**
 * Order table columns shared by the customer, vendor and admin order pages.
 * `orderHref(order)` builds the detail link for the role; `show` picks extra columns.
 *
 * @param {{ orderHref: (o: object) => string, show?: { vendor?: boolean, customer?: boolean, rider?: boolean } }} opts
 */
export function orderColumns({ orderHref, show = {} }) {
  const cols = [
    {
      key: 'code',
      header: 'Order',
      primary: true,
      cell: (o) => (
        <Link to={orderHref(o)} className="font-medium text-primary-700 hover:underline">
          {formatOrderNumber(o.code)}
        </Link>
      ),
    },
    {
      key: 'createdAt',
      header: 'Placed',
      sortable: true,
      cell: (o) => formatDateTime(o.createdAt),
    },
  ];
  if (show.vendor) cols.push({ key: 'vendorName', header: 'Vendor', sortable: true });
  if (show.customer) cols.push({ key: 'customerName', header: 'Customer', sortable: true });
  if (show.rider)
    cols.push({
      key: 'riderName',
      header: 'Rider',
      cell: (o) => o.rider?.name ?? o.riderName ?? '—',
    });
  cols.push(
    {
      key: 'items',
      header: 'Items',
      hideOnMobile: true,
      cell: (o) => (
        <span className="line-clamp-1 max-w-[220px]">
          {o.items.map((l) => `${l.quantity} × ${l.name}`).join(', ')}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      sortable: true,
      cell: (o) => formatNaira(o.total),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (o) => <OrderStatusBadge status={o.status} />,
    },
  );
  return cols;
}
