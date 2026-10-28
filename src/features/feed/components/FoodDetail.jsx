import { Clock, Flag, SearchX, Star, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { EmptyState, ErrorState, Skeleton, SkeletonText } from '@/components/feedback';
import { Avatar, Badge, Button, PriceTag } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { useSession } from '@/features/auth';
import { AddToCartForm } from '@/features/cart';
import { FoodGallery, useFoodItem } from '@/features/catalogue';
import { formatDistance, formatRating } from '@/lib/format';

import { CommentThread } from './CommentThread';
import { LikeButton } from './LikeButton';
import { ReportDialog } from './ReportDialog';
import { ShareButton } from './ShareButton';

/** Food detail: photos, options, add to cart, likes, share and comments. */
export function FoodDetail({ id }) {
  const { data: item, isLoading, isError, error, refetch } = useFoodItem(id);
  const { user } = useSession();
  const [reporting, setReporting] = useState(false);

  if (isLoading) return <FoodDetailSkeleton />;
  if (isError) {
    if (error?.status === 404) {
      return (
        <EmptyState
          icon={SearchX}
          title="We couldn't find that dish"
          message="It may have been removed or the store is closed for now."
          action={
            <Button asChild>
              <Link to={ROUTES.home}>Browse food</Link>
            </Button>
          }
        />
      );
    }
    return <ErrorState title="We couldn't load this dish" error={error} onRetry={refetch} />;
  }

  const { vendor } = item;
  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <FoodGallery photos={item.photos} alt={`${item.name} from ${vendor.name}`} />
        <div className="space-y-4">
          <div className="space-y-1">
            {item.categoryName && <p className="text-sm text-ink-muted">{item.categoryName}</p>}
            <h1 className="text-2xl font-semibold">{item.name}</h1>
            <PriceTag amount={item.price} size="lg" />
          </div>
          <Link
            to={ROUTES.storefront(vendor.slug)}
            className="flex items-center gap-3 rounded-card border border-surface-border p-3 hover:border-primary"
          >
            <Avatar src={vendor.logo} name={vendor.name} shape="square" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{vendor.name}</p>
              <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
                <span className="inline-flex items-center gap-0.5">
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden="true" />
                  {formatRating(vendor.rating)} ({vendor.ratingCount})
                </span>
                {item.distanceM != null && <span>{formatDistance(item.distanceM)}</span>}
                {vendor.area && <span>{vendor.area}</span>}
              </p>
            </div>
            <Badge tone={vendor.isOpen ? 'success' : 'neutral'} dot>
              {vendor.isOpen ? 'Open' : 'Closed'}
            </Badge>
          </Link>
          {item.description && <p className="text-sm text-ink">{item.description}</p>}
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-1">
              <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
              {item.portion}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" aria-hidden="true" />
              Ready in about {item.prepTimeMins} min
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-1 border-y border-surface-border py-1">
            <LikeButton item={item} />
            <ShareButton
              title={item.name}
              text={`${item.name} from ${vendor.name} on KJT Foodie`}
              path={ROUTES.food(item.id)}
            />
            {user && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Flag className="h-4 w-4" />}
                onClick={() => setReporting(true)}
              >
                Report
              </Button>
            )}
          </div>
          <AddToCartForm key={item.id} item={item} />
        </div>
      </div>
      <CommentThread foodItemId={item.id} vendorId={item.vendorId} count={item.commentsCount} />
      <ReportDialog
        open={reporting}
        onClose={() => setReporting(false)}
        targetType="food_item"
        targetId={item.id}
        what="dish"
      />
    </div>
  );
}

function FoodDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading dish" className="grid gap-6 md:grid-cols-2">
      <Skeleton className="aspect-[4/3] w-full rounded-card" />
      <div className="space-y-4">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-16 w-full rounded-card" />
        <SkeletonText lines={3} />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
