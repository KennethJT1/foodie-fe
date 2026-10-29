import { CreditCard } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { PageHeader } from '@/components/data';
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Skeleton,
  SkeletonText,
  toast,
} from '@/components/feedback';
import { Button, Card, CardTitle, StatusBadge } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { SUBSCRIPTION_STATUS as S, SUBSCRIPTION_STATUS_META } from '@/constants/statuses';
import { formatDate, formatNaira } from '@/lib/format';

import { InvoiceTable } from './InvoiceTable';
import { INTERVAL_LABELS } from '../constants';
import {
  useCancelPlan,
  useMySubscription,
  usePayForPlan,
  useResumePlan,
} from '../hooks/useSubscription';
import { paymentErrorMessage } from '../lib/payment-toast';
import { planFeatures } from '../lib/plans';
import { statusLine } from '../lib/status';

/** Current plan, renewal date, renew / change / cancel, and invoices. */
export function SubscriptionView() {
  const { data: mine, isLoading, isError, error, refetch } = useMySubscription();
  const pay = usePayForPlan();
  const cancel = useCancelPlan();
  const resume = useResumePlan();
  const [isCancelling, setCancelling] = useState(false);
  const [payError, setPayError] = useState(null);

  if (isLoading) {
    return (
      <div role="status" aria-label="Loading your subscription" className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-48 rounded-card" />
        <SkeletonText lines={5} />
      </div>
    );
  }
  if (isError)
    return (
      <ErrorState title="We couldn't load your subscription" error={error} onRetry={refetch} />
    );

  const sub = mine.subscription;
  if (!sub || mine.status === S.NONE) {
    return (
      <div>
        <PageHeader title="Subscription" />
        <Card>
          <EmptyState
            icon={CreditCard}
            title="You don't have a plan yet"
            message={
              mine.trialAvailable
                ? `Start a free ${mine.trialDays}-day trial to open your store to customers.`
                : 'Pick a plan to open your store to customers.'
            }
            action={
              <Button asChild>
                <Link to={ROUTES.vendor.plans}>See plans</Link>
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const plan = sub.plan;
  const needsPayment = mine.status === S.EXPIRED || mine.status === S.GRACE;
  const isRunning = mine.status === S.ACTIVE || mine.status === S.TRIAL;
  const badgeStatus = isRunning && sub.cancelAtPeriodEnd ? S.CANCELLED : mine.status;

  const renew = () => {
    setPayError(null);
    pay.mutate(
      { planId: plan.id, interval: sub.interval },
      {
        onSuccess: () => toast.success(`Your ${plan.name} plan is active again. Welcome back.`),
        onError: (e) => setPayError(paymentErrorMessage(e)),
      },
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Subscription" description="Your plan, renewals and invoices." />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:items-start">
        <Card header={<CardTitle title="Current plan" />}>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-2xl font-bold">{plan.name}</p>
                <p className="text-sm text-ink-muted">
                  {mine.status === S.TRIAL
                    ? 'Free trial'
                    : `${formatNaira(sub.amount)} · ${INTERVAL_LABELS[sub.interval]}`}
                </p>
              </div>
              <StatusBadge status={badgeStatus} meta={SUBSCRIPTION_STATUS_META} />
            </div>
            <p className="text-sm" aria-live="polite">
              {statusLine(mine)}
            </p>
            {sub.scheduledChange && isRunning && (
              <p className="rounded-lg bg-info-50 p-3 text-sm text-blue-800">
                You move to {sub.scheduledChange.planName} (
                {INTERVAL_LABELS[sub.scheduledChange.interval].toLowerCase()}) on{' '}
                {formatDate(sub.currentPeriodEnd)}.
              </p>
            )}
            {payError && (
              <p role="alert" className="rounded-lg bg-danger-50 p-3 text-sm text-red-700">
                {payError}
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {needsPayment && (
                <Button loading={pay.isPending} onClick={renew}>
                  Renew {plan.name} – {formatNaira(sub.amount)}
                </Button>
              )}
              {mine.status === S.TRIAL && (
                <Button asChild>
                  <Link to={ROUTES.vendor.plans}>Pay for a plan</Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link to={ROUTES.vendor.plans}>Change plan</Link>
              </Button>
              {isRunning &&
                (sub.cancelAtPeriodEnd ? (
                  <Button
                    variant="ghost"
                    loading={resume.isPending}
                    onClick={() =>
                      resume.mutate(undefined, {
                        onSuccess: () => toast.success('Your plan will renew as normal.'),
                        onError: (e) => toast.error(e),
                      })
                    }
                  >
                    Keep my plan
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => setCancelling(true)}>
                    Cancel plan
                  </Button>
                ))}
            </div>
          </div>
        </Card>
        <Card header={<CardTitle title="What's included" />}>
          <ul className="space-y-1.5 text-sm">
            {planFeatures(plan).map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </Card>
      </div>
      <Card header={<CardTitle title="Invoices" />} padding="sm">
        <InvoiceTable />
      </Card>
      <ConfirmDialog
        open={isCancelling}
        onClose={() => setCancelling(false)}
        title="Cancel your plan?"
        message={`You keep every feature until ${formatDate(sub.currentPeriodEnd)}. After that, customers can't see your store until you pick a plan again.`}
        confirmLabel="Cancel plan"
        cancelLabel="Keep my plan"
        tone="danger"
        isLoading={cancel.isPending}
        onConfirm={() =>
          cancel.mutate(undefined, {
            onSuccess: () => {
              toast.success(`Your plan ends on ${formatDate(sub.currentPeriodEnd)}.`);
              setCancelling(false);
            },
            onError: (e) => toast.error(e),
          })
        }
      />
    </div>
  );
}
