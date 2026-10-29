import { Clock, MapPin, Star, Store } from 'lucide-react';
import { Link } from 'react-router-dom';

import { EmptyState, ErrorState, Skeleton, SkeletonCards } from '@/components/feedback';
import { Avatar, Button, ShareButton } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
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

  const hoursLabel = openingLabel(vendor.openingHours, {
    isOpen: vendor.isOpen,
    isPaused: vendor.isPaused,
  });

  return (
    <div className="space-y-6">
      {/* Navy banner (UI kit): details on the left, cover with logo and rating box on the right */}
      <section className="relative overflow-hidden rounded-2xl bg-ink text-white">
        <div className="grid gap-6 p-5 md:grid-cols-[1fr_minmax(0,460px)] md:p-10">
          <div className="flex flex-col gap-4">
            {vendor.description && <p className="text-sm text-white/80">{vendor.description}</p>}
            <h1 className="text-3xl font-bold text-white md:text-5xl">{vendor.name}</h1>
            <ul className="flex flex-wrap gap-2 text-sm">
              <li className="inline-flex items-center gap-1.5 rounded-full border border-white/70 px-4 py-2">
                <Clock className="h-4 w-4" aria-hidden="true" />
                Prep about {vendor.prepTimeMins} min
              </li>
              <li className="inline-flex items-center gap-1.5 rounded-full border border-white/70 px-4 py-2">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {vendor.address?.area}, {vendor.city}
                {vendor.distanceM != null && ` · ${formatDistance(vendor.distanceM)}`}
              </li>
            </ul>
            <div className="flex flex-wrap gap-2">
              <FollowButton vendor={vendor} />
              <ShareButton
                variant="outline"
                size="md"
                title={vendor.name}
                text={`Order from ${vendor.name} on KJT Foodie`}
                path={ROUTES.storefront(vendor.slug)}
              />
            </div>
            <p className="mt-auto inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-ink">
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span>{vendor.isOpen ? 'Open now' : 'Closed'}</span>
              <span className="font-normal">· {hoursLabel}</span>
            </p>
          </div>

          <div className="relative">
            <div className="aspect-[16/10] overflow-hidden rounded-xl bg-primary-50">
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
            <Avatar
              src={vendor.logo}
              name={vendor.name}
              size="xl"
              shape="square"
              className="absolute right-3 top-3 border-4 border-white shadow-pop"
            />
            <div className="absolute -bottom-3 left-3 rounded-xl bg-surface px-4 py-2.5 text-ink shadow-pop md:-left-8">
              <p className="text-3xl font-bold leading-none">{formatRating(vendor.rating)}</p>
              <p className="mt-1 flex items-center gap-0.5" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={
                      n <= Math.round(vendor.rating)
                        ? 'h-3.5 w-3.5 fill-primary text-primary'
                        : 'h-3.5 w-3.5 text-gray-300'
                    }
                  />
                ))}
              </p>
              <p className="text-xs text-ink-muted">
                <span className="sr-only">Rated {formatRating(vendor.rating)} out of 5 from </span>
                {formatCount(vendor.ratingCount)} reviews · {formatCount(vendor.followersCount)}{' '}
                followers
              </p>
            </div>
          </div>
        </div>
      </section>

      <details className="group rounded-card bg-surface p-4 text-sm shadow-card">
        <summary className="cursor-pointer font-semibold">Opening hours and delivery</summary>
        <OpeningHours hours={vendor.openingHours} className="mt-3" />
      </details>

      <section aria-labelledby="menu-title" className="space-y-3">
        <h2 id="menu-title" className="text-xl font-bold md:text-2xl">
          All offers from {vendor.name}
        </h2>
        <StorefrontMenu vendor={vendor} />
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
