import { Heart, MessageCircle, Star, Users } from 'lucide-react';
import { useState } from 'react';

import { PageHeader, StatCard } from '@/components/data';
import { EmptyState, ErrorState } from '@/components/feedback';
import { Card, CardTitle, Tabs } from '@/components/ui';
import { CommentInbox } from '@/features/feed';
import { VendorReviewInbox } from '@/features/reviews';
import { formatCount, formatRating, formatRelative } from '@/lib/format';
import { useAuthStore } from '@/stores/auth-store';

import { useVendorEngagement } from '../hooks/useVendorReports';

/** Likes, followers, comments to answer and reviews to reply to. */
export function VendorEngagement() {
  const { data, isLoading, isError, error, refetch } = useVendorEngagement();
  const vendorId = useAuthStore((s) => s.user?.vendor?.id);
  const [tab, setTab] = useState('comments');

  return (
    <div className="space-y-4">
      <PageHeader title="Engagement" description="What customers say about your food." />
      {isError ? (
        <ErrorState title="We couldn't load your numbers" error={error} onRetry={refetch} />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Likes on your dishes"
            icon={Heart}
            loading={isLoading}
            value={formatCount(data?.likesCount)}
          />
          <StatCard
            label="Followers"
            icon={Users}
            loading={isLoading}
            value={formatCount(data?.followersCount)}
            hint={data && `${data.newFollowers} new this month`}
          />
          <StatCard
            label="Comments waiting"
            icon={MessageCircle}
            loading={isLoading}
            value={formatCount(data?.unansweredComments)}
          />
          <StatCard
            label="Rating"
            icon={Star}
            loading={isLoading}
            value={formatRating(data?.rating)}
            hint={data && `${formatCount(data.ratingCount)} reviews`}
          />
        </div>
      )}
      <Tabs
        variant="pills"
        aria-label="Engagement"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'comments', label: 'Comments', count: data?.unansweredComments },
          { value: 'reviews', label: 'Reviews' },
          { value: 'followers', label: 'Followers and likes' },
        ]}
      />
      {tab === 'comments' && <CommentInbox />}
      {tab === 'reviews' && vendorId && <VendorReviewInbox vendorId={vendorId} />}
      {tab === 'followers' && data && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card header={<CardTitle title="Most liked dishes" />}>
            {data.topLiked.length ? (
              <ol className="space-y-2 text-sm">
                {data.topLiked.map((i) => (
                  <li key={i.id} className="flex justify-between gap-3">
                    <span>{i.name}</span>
                    <span className="text-ink-muted">{formatCount(i.likesCount)} likes</span>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState compact icon={Heart} title="No likes yet" />
            )}
          </Card>
          <Card header={<CardTitle title="New followers" />}>
            {data.recentFollowers.length ? (
              <ul className="space-y-2 text-sm">
                {data.recentFollowers.map((f) => (
                  <li key={f.id} className="flex justify-between gap-3">
                    <span>{f.name}</span>
                    <span className="text-ink-muted">{formatRelative(f.createdAt)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                compact
                icon={Users}
                title="No followers yet"
                message="Customers follow you from your store page."
              />
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
