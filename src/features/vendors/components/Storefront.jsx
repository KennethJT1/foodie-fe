import { Clock, MapPin, Star, Store } from 'lucide-react';
import { Link } from 'react-router-dom';

import { EmptyState, ErrorState, Skeleton, SkeletonCards } from '@/components/feedback';
import { Avatar, Badge, Button } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { ShareButton } from '@/features/feed';
import { formatCount, formatDistance, formatRating } from '@/lib/format';
import { openingLabel } from '@/lib/opening-hours';

import { FollowButton } from './FollowButton';
import { OpeningHours } from './OpeningHours';
import { StorefrontMenu } from './StorefrontMenu';
import { useVendor } from '../hooks/useVendors';

/** Vendor storefront: cover, logo, rating, hours, open/closed, menu and follow (FR-VEN-04). */
export function Storefront({ slug, children }) {
  const { data: vendor, isLoading, isError, error, refetch } = useVendor(slug);

  if (isLoading) return <StorefrontSkeleton />;
  if (isError) {
    if (error?.status === 404) {
      return (
        <EmptyState
          icon={Store}
          title="This store isn't available"
          message="It may be closed for now. Find other great food near you."
          action={
            <Button asChild>
              <Link to={ROUTES.home}>Browse food</Link>
            </Button>
          }
        />
      );
    }
    return <ErrorState title="We couldn't load this store" error={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-card bg-surface shadow-card">
        <div className="h-32 bg-primary-50 md:h-52">
          {vendor.cover && (
            <img
              src={vendor.cover}
              alt={`${vendor.name} cover`}
              className="h-full w-full object-cover"
              width={1200}
              height={400}
            />
          )}
        </div>
        <div className="space-y-3 p-4 md:p-6">
          <div className="-mt-12 flex items-end gap-3 md:-mt-16">
            <Avatar
              src={vendor.logo}
              name={vendor.name}
              size="xl"
              shape="square"
              className="border-4 border-surface shadow-card"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">{vendor.name}</h1>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-accent text-accent" aria-hidden="true" />
                  {formatRating(vendor.rating)} ({formatCount(vendor.ratingCount)} ratings)
                </span>
                <span>{formatCount(vendor.followersCount)} followers</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  {vendor.address?.area}, {vendor.city} · {formatDistance(vendor.distanceM)}
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              <FollowButton vendor={vendor} />
              <ShareButton
                variant="outline"
                size="md"
                title={vendor.name}
                text={`Order from ${vendor.name} on KJT Foodie`}
                path={ROUTES.storefront(vendor.slug)}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge tone={vendor.isOpen ? 'success' : 'neutral'} dot>
              {vendor.isOpen ? 'Open now' : 'Closed'}
            </Badge>
            <span className="text-ink-muted">
              {openingLabel(vendor.openingHours, {
                isOpen: vendor.isOpen,
                isPaused: vendor.isPaused,
              })}
            </span>
            <span className="inline-flex items-center gap-1 text-ink-muted">
              <Clock className="h-4 w-4" aria-hidden="true" />
              Prep about {vendor.prepTimeMins} min
            </span>
          </div>
          {vendor.description && <p className="text-sm">{vendor.description}</p>}
          <details className="group text-sm">
            <summary className="cursor-pointer font-medium text-primary-700">Opening hours</summary>
            <OpeningHours hours={vendor.openingHours} className="mt-2" />
          </details>
        </div>
      </div>

      <section aria-labelledby="menu-title" className="space-y-3">
        <h2 id="menu-title" className="text-lg font-semibold">
          Menu
        </h2>
        <StorefrontMenu vendorId={vendor.id} />
      </section>
      {typeof children === 'function' ? children(vendor) : children}
    </div>
  );
}

function StorefrontSkeleton() {
  return (
    <div role="status" aria-label="Loading store" className="space-y-6">
      <Skeleton className="h-56 w-full rounded-card" />
      <Skeleton className="h-6 w-1/3" />
      <SkeletonCards count={3} />
    </div>
  );
}
