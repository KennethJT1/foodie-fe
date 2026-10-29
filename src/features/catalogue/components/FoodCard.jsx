import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge, PriceTag } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/cn';
import { formatDistance, formatRating } from '@/lib/format';

import { FoodImage } from './FoodImage';

/** Compact food tile for search results, menus and liked items. */
export function FoodCard({ item, showVendor = true, className }) {
  const vendorName = item.vendor?.name;
  return (
    <Link
      to={ROUTES.food(item.id)}
      className={cn(
        'group block overflow-hidden rounded-card bg-surface shadow-card transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink',
        className,
      )}
    >
      <div className="relative">
        <FoodImage
          src={item.photos?.[0]}
          alt={vendorName ? `${item.name} from ${vendorName}` : item.name}
        />
        {!item.isAvailable && (
          <Badge tone="neutral" className="absolute left-2 top-2 bg-white/90">
            Sold out
          </Badge>
        )}
      </div>
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-1 font-medium text-ink group-hover:text-primary-700">
          {item.name}
        </h3>
        {showVendor && vendorName && (
          <p className="line-clamp-1 text-sm text-ink-muted">{vendorName}</p>
        )}
        <PriceTag amount={item.price} size="sm" />
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
          {item.vendor?.rating ? (
            <span className="inline-flex items-center gap-0.5">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden="true" />
              <span className="sr-only">Rated</span>
              {formatRating(item.vendor.rating)}
            </span>
          ) : null}
          {item.distanceM != null && <span>{formatDistance(item.distanceM)}</span>}
        </p>
      </div>
    </Link>
  );
}
