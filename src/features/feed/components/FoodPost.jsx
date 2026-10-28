import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Avatar, Button, PriceTag } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { FoodImage } from '@/features/catalogue';
import { formatCount, formatDistance, formatRelative } from '@/lib/format';

import { LikeButton } from './LikeButton';
import { ShareButton } from './ShareButton';

/** A food post in the home feed: vendor, photo, price, likes and comments. */
export function FoodPost({ item }) {
  const { vendor } = item;
  return (
    <article className="overflow-hidden rounded-card bg-surface shadow-card">
      <header className="flex items-center gap-3 p-3">
        <Avatar src={vendor?.logo} name={vendor?.name} size="sm" shape="square" />
        <div className="min-w-0 flex-1">
          <Link
            to={ROUTES.storefront(vendor?.slug)}
            className="line-clamp-1 text-sm font-semibold hover:text-primary-700"
          >
            {vendor?.name}
          </Link>
          <p className="text-xs text-ink-muted">
            {[
              item.distanceM != null && formatDistance(item.distanceM),
              formatRelative(item.createdAt),
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        {vendor && !vendor.isOpen && <span className="text-xs text-ink-muted">Closed now</span>}
      </header>
      <Link to={ROUTES.food(item.id)} className="block" tabIndex={-1} aria-hidden="true">
        <FoodImage src={item.photos?.[0]} alt={`${item.name} from ${vendor?.name}`} />
      </Link>
      <div className="space-y-1 px-3 pt-3">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-semibold">
            <Link to={ROUTES.food(item.id)} className="hover:text-primary-700">
              {item.name}
            </Link>
          </h2>
          <PriceTag amount={item.price} />
        </div>
        {item.description && (
          <p className="line-clamp-2 text-sm text-ink-muted">{item.description}</p>
        )}
      </div>
      <footer className="flex items-center gap-1 px-1 py-1">
        <LikeButton item={item} />
        <Link
          to={`${ROUTES.food(item.id)}#comments`}
          aria-label={`${item.commentsCount} comments on ${item.name}`}
          className="inline-flex min-h-tap items-center gap-1.5 rounded-full px-2 text-sm font-medium text-ink-muted hover:bg-primary-50"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          <span aria-hidden="true">{formatCount(item.commentsCount)}</span>
        </Link>
        <ShareButton
          title={item.name}
          text={`${item.name} from ${vendor?.name} on KJT Foodie`}
          path={ROUTES.food(item.id)}
        />
        <Button asChild size="sm" className="ml-auto mr-2">
          <Link to={ROUTES.food(item.id)}>Order</Link>
        </Button>
      </footer>
    </article>
  );
}

export function FoodPostSkeleton() {
  return (
    <div className="overflow-hidden rounded-card bg-surface shadow-card" aria-hidden="true">
      <div className="flex items-center gap-3 p-3">
        <div className="h-8 w-8 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="aspect-[4/3] w-full animate-pulse bg-gray-200" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}
