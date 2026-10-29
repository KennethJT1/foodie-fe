import { SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';

import { ApprovalActions, DocumentGallery, PageHeader, StatCard } from '@/components/data';
import { EmptyState, ErrorState, Skeleton, SkeletonText } from '@/components/feedback';
import { Badge, Button, Card, CardTitle, StatusBadge } from '@/components/ui';
import { PERMISSIONS } from '@/constants/permissions';
import { ROUTES } from '@/constants/routes';
import { APPROVAL_STATUS_META } from '@/constants/statuses';
import { Can } from '@/features/auth';
import {
  formatCount,
  formatDate,
  formatDateTime,
  formatNaira,
  formatOrderNumber,
  formatPhone,
  formatRating,
} from '@/lib/format';

import { VEHICLE_LABELS } from '../../constants';
import { useAdminRider, useRiderDecision } from '../../hooks/useAdminRiders';

const vehicleLabel = (type) => VEHICLE_LABELS[type] ?? 'Rider';

function Row({ label, children }) {
  return (
    <div>
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-medium">{children || '—'}</dd>
    </div>
  );
}

/** One rider: vehicle, licence, guarantor, documents, bank and recent trips, with the decision. */
export function AdminRiderDetail({ id }) {
  const { data: r, isLoading, isError, error, refetch } = useAdminRider(id);
  const decide = useRiderDecision();
  if (isLoading)
    return (
      <div role="status" aria-label="Loading rider" className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <SkeletonText lines={8} />
      </div>
    );
  if (isError) {
    if (error?.status === 404)
      return (
        <EmptyState
          icon={SearchX}
          title="We couldn't find that rider"
          action={
            <Button asChild>
              <Link to={ROUTES.admin.riders}>All riders</Link>
            </Button>
          }
        />
      );
    return <ErrorState title="We couldn't load this rider" error={error} onRetry={refetch} />;
  }
  const act = (action) => (reason) => decide.mutateAsync({ id: r.id, action, reason });
  return (
    <div className="space-y-4">
      <PageHeader
        title={r.name}
        description={`${vehicleLabel(r.vehicleType)} · ${r.city} · joined ${formatDate(r.createdAt)}`}
        backTo={r.approvalStatus === 'pending' ? ROUTES.admin.riderApprovals : ROUTES.admin.riders}
        backLabel={r.approvalStatus === 'pending' ? 'Rider approvals' : 'Riders'}
        actions={
          <Can permission={PERMISSIONS.RIDERS_APPROVE}>
            <ApprovalActions
              status={r.approvalStatus}
              name={r.name}
              noun="rider"
              onApprove={act('approve')}
              onReject={act('reject')}
              onSuspend={act('suspend')}
              onReinstate={act('reinstate')}
            />
          </Can>
        }
      >
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={r.approvalStatus} meta={APPROVAL_STATUS_META} />
          {r.isOnline && (
            <Badge tone={r.isBusy ? 'info' : 'success'} dot>
              {r.isBusy ? 'On a delivery' : 'Online'}
            </Badge>
          )}
        </div>
      </PageHeader>
      {(r.rejectionReason || r.suspensionReason) && (
        <p className="rounded-card bg-danger-50 p-3 text-sm text-red-800">
          {r.approvalStatus === 'suspended' ? 'Suspended: ' : 'Rejected: '}
          {r.suspensionReason ?? r.rejectionReason}
        </p>
      )}
      {r.approvalStatus !== 'pending' && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatCard label="Trips" value={formatCount(r.tripsCount)} />
          <StatCard
            label="Rating"
            value={formatRating(r.rating)}
            hint={`${r.ratingCount} ratings`}
          />
          <StatCard
            label="Last seen"
            value={r.lastSeenAt ? formatDateTime(r.lastSeenAt) : '—'}
            className="col-span-2 lg:col-span-1"
          />
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-4">
          <Card
            header={
              <CardTitle
                title="Documents"
                description={r.submittedAt ? `Sent ${formatDateTime(r.submittedAt)}` : undefined}
              />
            }
          >
            <DocumentGallery documents={r.documents} />
          </Card>
          <Card header={<CardTitle title="Recent trips" />}>
            {r.recentTrips.length ? (
              <ul className="divide-y divide-surface-border text-sm">
                {r.recentTrips.map((t) => (
                  <li key={t.id} className="flex justify-between gap-3 py-2">
                    <Link
                      to={ROUTES.admin.order(t.orderId)}
                      className="text-primary-700 hover:underline"
                    >
                      {formatOrderNumber(t.orderCode)}
                    </Link>
                    <span className="text-ink-muted">{formatDateTime(t.deliveredAt)}</span>
                    <span>{formatNaira(t.fee)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">No trips yet.</p>
            )}
          </Card>
        </div>
        <div className="space-y-4">
          <Card header={<CardTitle title="Rider" />}>
            <dl className="space-y-2 text-sm">
              <Row label="Phone">{formatPhone(r.phone)}</Row>
              <Row label="Vehicle">
                {[VEHICLE_LABELS[r.vehicleType], r.plateNumber].filter(Boolean).join(' · ')}
              </Row>
              <Row label="Licence number">{r.licenceNumber}</Row>
              <Row label="Payout account">
                {r.bank && `${r.bank.accountName} · ${r.bank.bankName} · ${r.bank.accountNumber}`}
              </Row>
            </dl>
          </Card>
          <Card header={<CardTitle title="Guarantor" />}>
            {r.guarantor ? (
              <dl className="space-y-2 text-sm">
                <Row label="Name">{`${r.guarantor.name} (${r.guarantor.relationship})`}</Row>
                <Row label="Phone">{formatPhone(r.guarantor.phone)}</Row>
                <Row label="Address">{r.guarantor.address}</Row>
              </dl>
            ) : (
              <p className="text-sm text-ink-muted">No guarantor yet.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
