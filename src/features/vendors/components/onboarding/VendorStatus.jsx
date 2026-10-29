import { CheckCircle2, Clock, ShieldAlert, XCircle } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';

import { ErrorState, Skeleton, SkeletonText } from '@/components/feedback';
import { Button, Card } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { APPROVAL_STATUS, SUBSCRIPTION_STATUS } from '@/constants/statuses';
import { useMe, useSession } from '@/features/auth';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';

import { useOnboarding } from '../../hooks/useOnboarding';

const TONES = {
  pending: 'bg-warning-50 text-warning',
  approved: 'bg-secondary-50 text-secondary',
  rejected: 'bg-danger-50 text-danger',
  suspended: 'bg-danger-50 text-danger',
};

function StatusCard({ icon: Icon, tone, title, children, actions }) {
  return (
    <Card className="mx-auto max-w-xl text-center" aria-live="polite">
      <span
        className={cn(
          'mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full',
          TONES[tone],
        )}
      >
        <Icon className="h-7 w-7" aria-hidden="true" />
      </span>
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="mt-2 space-y-2 text-sm text-ink-muted">{children}</div>
      {actions && (
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">{actions}</div>
      )}
    </Card>
  );
}

/** Pending, rejected (with reason), approved or suspended (RequireApproved sends vendors here). */
export function VendorStatus() {
  const { data, isLoading, isError, error, refetch, isFetching } = useOnboarding();
  // Keeps the session (and so the guards) in step with the latest approval decision
  const me = useMe();
  const { user } = useSession();

  if (isLoading) {
    return (
      <div role="status" aria-label="Loading your status" className="mx-auto max-w-xl space-y-4">
        <Skeleton className="mx-auto h-14 w-14 rounded-full" />
        <SkeletonText lines={4} />
      </div>
    );
  }
  if (isError)
    return <ErrorState title="We couldn't load your status" error={error} onRetry={refetch} />;

  const checkAgain = () => {
    refetch();
    me.refetch();
  };

  switch (data.approvalStatus) {
    case APPROVAL_STATUS.DRAFT:
      return <Navigate to={ROUTES.vendor.onboarding} replace />;
    case APPROVAL_STATUS.PENDING:
      return (
        <StatusCard
          icon={Clock}
          tone="pending"
          title="We're checking your documents"
          actions={
            <Button variant="outline" loading={isFetching} onClick={checkAgain}>
              Check again
            </Button>
          }
        >
          <p>
            {data.name} was sent for review on {formatDateTime(data.submittedAt)}. This usually
            takes 1–2 working days.
          </p>
          <p>We&apos;ll text and email you as soon as there&apos;s a decision.</p>
        </StatusCard>
      );
    case APPROVAL_STATUS.REJECTED:
      return (
        <StatusCard
          icon={XCircle}
          tone="rejected"
          title="We couldn't approve your store yet"
          actions={
            <Button asChild>
              <Link to={ROUTES.vendor.onboarding}>Fix and resubmit</Link>
            </Button>
          }
        >
          <p className="rounded-lg bg-danger-50 p-3 text-left text-ink">{data.rejectionReason}</p>
          <p>Update the details our team mentioned and send them again.</p>
        </StatusCard>
      );
    case APPROVAL_STATUS.APPROVED: {
      const hasPlan = user?.vendor?.subscriptionStatus !== SUBSCRIPTION_STATUS.NONE;
      return (
        <StatusCard
          icon={CheckCircle2}
          tone="approved"
          title="Your store is approved"
          actions={
            <Button asChild>
              <Link to={hasPlan ? ROUTES.vendor.root : ROUTES.vendor.plans}>
                {hasPlan ? 'Go to your dashboard' : 'Pick a plan to go live'}
              </Link>
            </Button>
          }
        >
          <p>
            {data.name} passed our checks. Pick a plan to open your store to customers. New stores
            get a free trial.
          </p>
        </StatusCard>
      );
    }
    default:
      return (
        <StatusCard
          icon={ShieldAlert}
          tone="suspended"
          title="Your store is suspended"
          actions={
            <Button asChild variant="outline">
              <Link to={ROUTES.vendor.support}>Contact support</Link>
            </Button>
          }
        >
          <p>Customers can&apos;t see your store right now. Our support team can tell you why.</p>
        </StatusCard>
      );
  }
}
