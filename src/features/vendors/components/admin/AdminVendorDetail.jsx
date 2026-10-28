import { SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';

import { ApprovalActions, DocumentGallery, PageHeader, StatCard } from '@/components/data';
import { EmptyState, ErrorState, Skeleton, SkeletonText } from '@/components/feedback';
import { Badge, Button, Card, CardTitle, StatusBadge } from '@/components/ui';
import { PERMISSIONS } from '@/constants/permissions';
import { ROUTES } from '@/constants/routes';
import {
  APPROVAL_STATUS_META,
  SUBSCRIPTION_STATUS_META,
  VENDOR_TYPE_LABELS,
} from '@/constants/statuses';
import { Can } from '@/features/auth';
import { formatDate, formatDateTime, formatNaira, formatPhone, formatRating } from '@/lib/format';

import {
  useAdminVendor,
  useBankChangeDecision,
  useVendorDecision,
} from '../../hooks/useAdminVendors';

function Row({ label, children }) {
  return (
    <div>
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-medium">{children ?? '—'}</dd>
    </div>
  );
}

/** One vendor: application, documents, bank, plan and numbers, with the approval decision. */
export function AdminVendorDetail({ id }) {
  const { data: v, isLoading, isError, error, refetch } = useAdminVendor(id);
  const decide = useVendorDecision();
  const bank = useBankChangeDecision();

  if (isLoading)
    return (
      <div role="status" aria-label="Loading vendor" className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <SkeletonText lines={8} />
      </div>
    );
  if (isError) {
    if (error?.status === 404)
      return (
        <EmptyState
          icon={SearchX}
          title="We couldn't find that vendor"
          action={
            <Button asChild>
              <Link to={ROUTES.admin.vendors}>All vendors</Link>
            </Button>
          }
        />
      );
    return <ErrorState title="We couldn't load this vendor" error={error} onRetry={refetch} />;
  }

  const act = (action) => (reason) => decide.mutateAsync({ id: v.id, action, reason });
  const change = v.bankChangeRequest?.status === 'pending' ? v.bankChangeRequest : null;
  return (
    <div className="space-y-4">
      <PageHeader
        title={v.name}
        description={`${VENDOR_TYPE_LABELS[v.type] ?? 'Vendor'} · ${v.city ?? '—'} · joined ${formatDate(v.createdAt)}`}
        backTo={
          v.approvalStatus === 'pending' ? ROUTES.admin.vendorApprovals : ROUTES.admin.vendors
        }
        backLabel={v.approvalStatus === 'pending' ? 'Vendor approvals' : 'Vendors'}
        actions={
          <Can permission={PERMISSIONS.VENDORS_APPROVE}>
            <ApprovalActions
              status={v.approvalStatus}
              name={v.name}
              noun="vendor"
              onApprove={act('approve')}
              onReject={act('reject')}
              onSuspend={act('suspend')}
              onReinstate={act('reinstate')}
            />
          </Can>
        }
      >
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={v.approvalStatus} meta={APPROVAL_STATUS_META} />
          {v.subscriptionStatus !== 'none' && (
            <StatusBadge status={v.subscriptionStatus} meta={SUBSCRIPTION_STATUS_META} />
          )}
          {v.isPaused && <Badge tone="warning">Orders paused</Badge>}
        </div>
      </PageHeader>
      {(v.rejectionReason || v.suspensionReason) && (
        <p className="rounded-card bg-danger-50 p-3 text-sm text-red-800">
          {v.approvalStatus === 'suspended' ? 'Suspended: ' : 'Rejected: '}
          {v.suspensionReason ?? v.rejectionReason}
        </p>
      )}
      {v.approvalStatus === 'approved' && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Orders, last 30 days" value={v.stats.orders30d} />
          <StatCard label="Food sales, last 30 days" value={formatNaira(v.stats.gmv30d)} />
          <StatCard
            label="Rating"
            value={formatRating(v.rating)}
            hint={`${v.ratingCount} reviews · ${v.refundRate}% refunds`}
          />
          <StatCard label="Open refunds" value={v.stats.openRefunds} />
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-4">
          <Card
            header={
              <CardTitle
                title="Documents"
                description={v.submittedAt ? `Sent ${formatDateTime(v.submittedAt)}` : undefined}
              />
            }
          >
            <DocumentGallery documents={v.documents} />
          </Card>
          <Card header={<CardTitle title="Business" />}>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Row label="Owner">{v.ownerName}</Row>
              <Row label="Phone">{formatPhone(v.phone)}</Row>
              <Row label="Email">{v.email}</Row>
              <Row label="Address">
                {[v.address?.line1, v.address?.area, v.address?.city].filter(Boolean).join(', ')}
              </Row>
              <Row label="Delivery radius">{`${v.deliveryRadiusKm} km`}</Row>
              <Row label="Menu items">{v.itemCount}</Row>
            </dl>
            {v.description && <p className="mt-3 text-sm text-ink-muted">{v.description}</p>}
            {v.slug && v.approvalStatus === 'approved' && (
              <Button asChild variant="link" className="mt-2">
                <Link to={ROUTES.storefront(v.slug)}>View store page</Link>
              </Button>
            )}
          </Card>
        </div>
        <div className="space-y-4">
          <Card header={<CardTitle title="Settlement account" />}>
            {v.bank ? (
              <dl className="space-y-2 text-sm">
                <Row label="Account name">{v.bank.accountName}</Row>
                <Row label="Bank">{`${v.bank.bankName} · ${v.bank.accountNumber}`}</Row>
              </dl>
            ) : (
              <p className="text-sm text-ink-muted">No bank account yet.</p>
            )}
            {change && (
              <div className="mt-4 space-y-2 rounded-lg bg-warning-50 p-3 text-sm">
                <p className="font-medium">Change requested {formatDate(change.requestedAt)}</p>
                <p>
                  {change.bankName} · {change.accountNumber} · {change.accountName}
                </p>
                <Can permission={PERMISSIONS.VENDORS_APPROVE}>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={bank.isPending}
                      onClick={() => bank.mutate({ id: v.id, decision: 'approve' })}
                    >
                      Approve change
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={bank.isPending}
                      onClick={() => bank.mutate({ id: v.id, decision: 'reject' })}
                    >
                      Reject change
                    </Button>
                  </div>
                </Can>
              </div>
            )}
          </Card>
          <Card header={<CardTitle title="Plan" />}>
            {v.subscription ? (
              <dl className="space-y-2 text-sm">
                <Row label="Plan">{`${v.planName} · ${v.subscription.interval}`}</Row>
                <Row label="Current period ends">{formatDate(v.subscription.currentPeriodEnd)}</Row>
              </dl>
            ) : (
              <p className="text-sm text-ink-muted">No plan yet.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
