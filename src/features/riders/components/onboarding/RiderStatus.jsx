import { CheckCircle2, Clock, ShieldAlert, XCircle } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';

import { ErrorState, SkeletonText } from '@/components/feedback';
import { Button, Card } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { useMe } from '@/features/auth';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';

import { useRiderOnboarding } from '../../hooks/useRiderOnboarding';

const STATES = {
  pending: {
    icon: Clock,
    tone: 'bg-warning-50 text-warning',
    title: "We're checking your details",
    body: (d) =>
      `You sent your application on ${formatDateTime(d.submittedAt)}. This usually takes 1–2 working days. We may call your guarantor.`,
  },
  rejected: {
    icon: XCircle,
    tone: 'bg-danger-50 text-danger',
    title: "We couldn't approve you yet",
    body: (d) => d.rejectionReason,
  },
  approved: {
    icon: CheckCircle2,
    tone: 'bg-secondary-50 text-secondary',
    title: "You're approved",
    body: () => 'Go online to start getting delivery jobs.',
  },
  suspended: {
    icon: ShieldAlert,
    tone: 'bg-danger-50 text-danger',
    title: 'Your account is suspended',
    body: () => "You can't take jobs right now. Our support team can tell you why.",
  },
};

/** Pending, rejected (with reason), approved or suspended (RequireApproved sends riders here). */
export function RiderStatus() {
  const { data, isLoading, isError, error, refetch, isFetching } = useRiderOnboarding();
  const me = useMe();
  if (isLoading) return <SkeletonText lines={4} />;
  if (isError)
    return <ErrorState title="We couldn't load your status" error={error} onRetry={refetch} />;
  if (data.approvalStatus === 'draft') return <Navigate to={ROUTES.rider.onboarding} replace />;
  const s = STATES[data.approvalStatus] ?? STATES.suspended;
  const action = {
    pending: (
      <Button
        variant="outline"
        loading={isFetching}
        onClick={() => {
          refetch();
          me.refetch();
        }}
      >
        Check again
      </Button>
    ),
    rejected: (
      <Button asChild>
        <Link to={ROUTES.rider.onboarding}>Fix and resubmit</Link>
      </Button>
    ),
    approved: (
      <Button asChild>
        <Link to={ROUTES.rider.root}>Go online</Link>
      </Button>
    ),
  }[data.approvalStatus] ?? (
    <Button asChild variant="outline">
      <Link to={ROUTES.rider.support}>Contact support</Link>
    </Button>
  );
  return (
    <Card className="mx-auto max-w-xl text-center" aria-live="polite">
      <span
        className={cn(
          'mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full',
          s.tone,
        )}
      >
        <s.icon className="h-7 w-7" aria-hidden="true" />
      </span>
      <h1 className="text-xl font-semibold">{s.title}</h1>
      <p className="mt-2 text-sm text-ink-muted">{s.body(data)}</p>
      <div className="mt-6 flex justify-center">{action}</div>
    </Card>
  );
}
