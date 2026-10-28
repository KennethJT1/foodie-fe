import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { PageHeader } from '@/components/data';
import { ConfirmDialog, ErrorState, Skeleton, toast } from '@/components/feedback';
import { Button, Tabs } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { SUBSCRIPTION_STATUS as S } from '@/constants/statuses';
import { formatDate } from '@/lib/format';

import { PlanCard } from './PlanCard';
import { BILLING_INTERVALS } from '../constants';
import {
  useMySubscription,
  usePayForPlan,
  usePlans,
  useSchedulePlanChange,
  useStartTrial,
} from '../hooks/useSubscription';
import { toastPaymentError } from '../lib/payment-toast';
import { planAction } from '../lib/plans';

function describe(mine, trialDays) {
  if (mine.trialAvailable) return `Try any plan free for ${trialDays} days. No card needed.`;
  if (mine.status === S.EXPIRED) return 'Your plan has expired. Pick a plan to reopen your store.';
  if (mine.status === S.GRACE)
    return "We couldn't take your last payment. Pay now to stay visible.";
  return 'Upgrade any time. Smaller plans start at your next renewal.';
}

/** Plan cards with a monthly / yearly switch, free trial and Paystack payment. */
export function PlansView() {
  const plans = usePlans();
  const mine = useMySubscription();
  const [chosenInterval, setChosenInterval] = useState(null);
  const [downgrade, setDowngrade] = useState(null);
  const navigate = useNavigate();
  const pay = usePayForPlan();
  const trial = useStartTrial();
  const change = useSchedulePlanChange();

  if (plans.isLoading || mine.isLoading) {
    return (
      <div role="status" aria-label="Loading plans" className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-96 rounded-card" />
          ))}
        </div>
      </div>
    );
  }
  const failed = plans.isError ? plans : mine.isError ? mine : null;
  if (failed)
    return (
      <ErrorState
        title="We couldn't load the plans"
        error={failed.error}
        onRetry={() => {
          plans.refetch();
          mine.refetch();
        }}
      />
    );

  const { trialDays, yearlyDiscountPct } = plans.data.meta;
  const sub = mine.data.subscription;
  const interval = chosenInterval ?? sub?.interval ?? BILLING_INTERVALS.MONTHLY;
  const busyPlan = [pay, trial, change].find((m) => m.isPending)?.variables?.planId;

  const act = (plan, kind) => {
    if (kind === 'trial')
      return trial.mutate(
        { planId: plan.id },
        {
          onSuccess: () => {
            toast.success(`Your ${trialDays}-day free trial of ${plan.name} has started.`);
            navigate(ROUTES.vendor.root);
          },
          onError: (e) => toast.error(e),
        },
      );
    if (kind === 'downgrade') return setDowngrade(plan);
    pay.mutate(
      { planId: plan.id, interval },
      {
        onSuccess: () => {
          toast.success(`You're on the ${plan.name} plan. Your store is visible to customers.`);
          navigate(ROUTES.vendor.subscription);
        },
        onError: toastPaymentError,
      },
    );
  };

  return (
    <div>
      <PageHeader
        title="Choose your plan"
        description={describe(mine.data, trialDays)}
        backTo={sub ? ROUTES.vendor.subscription : undefined}
        backLabel="Subscription"
      />
      <Tabs
        variant="pills"
        aria-label="Billing period"
        className="mb-4"
        value={interval}
        onChange={setChosenInterval}
        items={[
          { value: BILLING_INTERVALS.MONTHLY, label: 'Monthly' },
          { value: BILLING_INTERVALS.YEARLY, label: `Yearly · save ${yearlyDiscountPct}%` },
        ]}
      />
      <div className="grid gap-4 md:grid-cols-3">
        {plans.data.data.map((plan) => {
          const action = planAction(plan, interval, mine.data);
          const isDisabled = action.kind === 'current' || action.kind === 'scheduled';
          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              interval={interval}
              isCurrent={action.kind === 'current'}
              action={
                <Button
                  fullWidth
                  variant={action.kind === 'downgrade' ? 'outline' : 'primary'}
                  disabled={isDisabled || (busyPlan && busyPlan !== plan.id)}
                  loading={busyPlan === plan.id}
                  onClick={() => act(plan, action.kind)}
                >
                  {action.label}
                </Button>
              }
            />
          );
        })}
      </div>
      <p className="mt-4 text-center text-xs text-ink-muted">
        Plans renew automatically. Cancel any time and keep your plan until the period ends.
      </p>
      <ConfirmDialog
        open={Boolean(downgrade)}
        onClose={() => setDowngrade(null)}
        title={`Switch to ${downgrade?.name} at renewal?`}
        message={
          sub
            ? `You keep ${sub.plan?.name} until ${formatDate(sub.currentPeriodEnd)}. After that you move to ${downgrade?.name} and its limits.`
            : ''
        }
        confirmLabel={`Switch to ${downgrade?.name}`}
        isLoading={change.isPending}
        onConfirm={() =>
          change.mutate(
            { planId: downgrade.id, interval },
            {
              onSuccess: () => {
                toast.success(`You'll move to ${downgrade.name} at your next renewal.`);
                setDowngrade(null);
              },
              onError: (e) => toast.error(e),
            },
          )
        }
      />
    </div>
  );
}
