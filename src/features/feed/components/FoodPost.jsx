import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Avatar, Badge, Button, ShareButton } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { FoodImage } from '@/features/catalogue';
import { formatCount, formatDistance, formatNaira, formatRelative } from '@/lib/format';

import { LikeButton } from './LikeButton';

/**
 * A food post in the home feed (UI kit "deal" card): photo with a dark gradient, price pill,
 * vendor and dish over the photo, then like / comment / share / order.
 */
export function FoodPost({ item }) {
  const { vendor } = item;
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-card bg-surface shadow-card">
      <Link
        to={ROUTES.food(item.id)}
        className="group relative block overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink"
      >
        <FoodImage
          src={item.photos?.[0]}
          alt={`${item.name} from ${vendor?.name}`}
          className="transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <span className="absolute right-3 top-3 rounded-lg bg-ink px-2.5 py-1 text-sm font-semibold text-white">
          {formatNaira(item.price)}
        </span>
        {vendor && !vendor.isOpen && (
          <Badge tone="neutral" className="absolute left-3 top-3 bg-white/90">
            Closed now
          </Badge>
        )}
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 via-ink/50 to-transparent px-4 pb-3 pt-10">
          <span className="block text-xs font-medium text-primary">{vendor?.name}</span>
          <span className="line-clamp-1 block text-lg font-bold text-white">{item.name}</span>
        </span>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <Avatar src={vendor?.logo} name={vendor?.name} size="xs" shape="square" />
          <Link
            to={ROUTES.storefront(vendor?.slug)}
            className="line-clamp-1 font-medium text-ink hover:underline"
          >
            {vendor?.name}
          </Link>
          <span aria-hidden="true">·</span>
          <span className="shrink-0">
            {[
              item.distanceM != null && formatDistance(item.distanceM),
              formatRelative(item.createdAt),
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </div>
        {item.description && (
          <p className="line-clamp-2 text-sm text-ink-muted">{item.description}</p>
        )}
        <footer className="mt-auto flex items-center gap-1">
          <LikeButton item={item} />
          <Link
            to={`${ROUTES.food(item.id)}#comments`}
            aria-label={`${item.commentsCount} comments on ${item.name}`}
            className="inline-flex min-h-tap items-center gap-1.5 rounded-full px-2 text-sm font-medium text-ink-muted hover:bg-surface-muted"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            <span aria-hidden="true">{formatCount(item.commentsCount)}</span>
          </Link>
          <ShareButton
            title={item.name}
            text={`${item.name} from ${vendor?.name} on KJT Foodie`}
            path={ROUTES.food(item.id)}
          />
          <Button asChild size="sm" className="ml-auto">
            <Link to={ROUTES.food(item.id)}>Order</Link>
          </Button>
        </footer>
      </div>
    </article>
  );
}

export function FoodPostSkeleton() {
  return (
    <div className="overflow-hidden rounded-card bg-surface shadow-card" aria-hidden="true">
      <div className="aspect-[4/3] w-full animate-pulse bg-gray-200" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}
