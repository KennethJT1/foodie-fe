import { Link } from 'react-router-dom';

import { Avatar, StatusBadge } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import {
  APPROVAL_STATUS_META,
  SUBSCRIPTION_STATUS_META,
  VENDOR_TYPE_LABELS,
} from '@/constants/statuses';
import { formatDate, formatRating } from '@/lib/format';

export const vendorColumns = [
  {
    key: 'name',
    header: 'Vendor',
    primary: true,
    sortable: true,
    cell: (v) => (
      <div className="flex items-center gap-3">
        <Avatar src={v.logo} name={v.name} size="sm" shape="square" />
        <div className="min-w-0">
          <Link
            to={ROUTES.admin.vendor(v.id)}
            className="font-medium hover:text-primary-700 hover:underline"
          >
            {v.name}
          </Link>
          <p className="text-xs text-ink-muted">
            {v.ownerName} · {v.city ?? '—'}
          </p>
        </div>
      </div>
    ),
  },
  {
    key: 'type',
    header: 'Type',
    hideOnMobile: true,
    cell: (v) => VENDOR_TYPE_LABELS[v.type] ?? '—',
  },
  {
    key: 'approvalStatus',
    header: 'Status',
    cell: (v) => <StatusBadge status={v.approvalStatus} meta={APPROVAL_STATUS_META} />,
  },
  {
    key: 'subscriptionStatus',
    header: 'Plan',
    hideOnMobile: true,
    cell: (v) =>
      v.subscriptionStatus === 'none' ? (
        '—'
      ) : (
        <span className="flex items-center gap-2">
          {v.planName}
          <StatusBadge status={v.subscriptionStatus} meta={SUBSCRIPTION_STATUS_META} />
        </span>
      ),
  },
  {
    key: 'rating',
    header: 'Rating',
    align: 'right',
    sortable: true,
    hideOnMobile: true,
    cell: (v) => formatRating(v.rating),
  },
  {
    key: 'createdAt',
    header: 'Joined',
    sortable: true,
    hideOnMobile: true,
    cell: (v) => formatDate(v.createdAt),
  },
];
