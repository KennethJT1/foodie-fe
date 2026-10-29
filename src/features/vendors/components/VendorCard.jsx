import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Avatar, Badge } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/cn';
import { formatCount, formatDistance, formatRating } from '@/lib/format';

/** Vendor row for lists (following, search). `action` sits on the right. */
export function VendorCard({ vendor, action, className }) {
  return (
    <div
      className={cn('flex items-center gap-3 rounded-card bg-surface p-3 shadow-card', className)}
    >
      <Avatar src={vendor.logo} name={vendor.name} size="lg" shape="square" />
      <div className="min-w-0 flex-1">
        <Link
          to={ROUTES.storefront(vendor.slug)}
          className="line-clamp-1 font-semibold hover:text-primary-700"
        >
          {vendor.name}
        </Link>
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-0.5">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden="true" />
            {formatRating(vendor.rating)}
          </span>
          <span>{formatCount(vendor.followersCount)} followers</span>
          {vendor.distanceM != null && <span>{formatDistance(vendor.distanceM)}</span>}
        </p>
        <Badge tone={vendor.isOpen ? 'success' : 'neutral'} dot className="mt-1">
          {vendor.isOpen ? 'Open' : 'Closed'}
        </Badge>
      </div>
      {action}
    </div>
  );
}
