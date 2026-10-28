import { ROUTES } from '@/constants/routes';
import { SUBSCRIPTION_STATUS as S } from '@/constants/statuses';
import { formatDate } from '@/lib/format';

import { daysUntil } from './plans';
import { TRIAL_REMINDER_DAYS } from '../constants';

/** One sentence about where the vendor's plan stands. */
export function statusLine({ status, subscription: sub }) {
  if (!sub || status === S.NONE) return "You don't have a plan yet.";
  if (status === S.TRIAL) return `Your free trial ends on ${formatDate(sub.trialEndsAt)}.`;
  if (status === S.GRACE)
    return `We couldn't take your last payment. Pay by ${formatDate(sub.graceEndsAt)} to keep your store visible.`;
  if (status === S.EXPIRED)
    return `Your plan ended on ${formatDate(sub.currentPeriodEnd)}. Customers can't see your store until you renew.`;
  if (sub.cancelAtPeriodEnd)
    return `Your plan ends on ${formatDate(sub.currentPeriodEnd)}. Renew to stay visible.`;
  return `Renews on ${formatDate(sub.currentPeriodEnd)}.`;
}

/**
 * The warning shown above every vendor page (BR-SUB-04/05/06), or null.
 * `{ tone: 'info'|'warning'|'danger', message, cta: { label, to } }`
 */
export function bannerFor(mine, now = Date.now()) {
  const sub = mine?.subscription;
  if (!sub) return null;
  if (mine.status === S.EXPIRED)
    return {
      tone: 'danger',
      message: "Your plan has expired, so customers can't see your store. Renew to reopen it.",
      cta: { label: 'Renew plan', to: ROUTES.vendor.subscription },
    };
  if (mine.status === S.GRACE)
    return {
      tone: 'warning',
      message: `We couldn't take your plan payment. Pay by ${formatDate(sub.graceEndsAt)} or customers won't see your store.`,
      cta: { label: 'Pay now', to: ROUTES.vendor.subscription },
    };
  if (mine.status === S.TRIAL && daysUntil(sub.trialEndsAt, now) <= TRIAL_REMINDER_DAYS)
    return {
      tone: daysUntil(sub.trialEndsAt, now) <= 1 ? 'warning' : 'info',
      message: `Your free trial ends on ${formatDate(sub.trialEndsAt)}. Pick a plan to stay visible.`,
      cta: { label: 'Choose a plan', to: ROUTES.vendor.plans },
    };
  if (
    mine.status === S.ACTIVE &&
    sub.cancelAtPeriodEnd &&
    daysUntil(sub.currentPeriodEnd, now) <= TRIAL_REMINDER_DAYS
  )
    return {
      tone: 'warning',
      message: `Your plan ends on ${formatDate(sub.currentPeriodEnd)}. Renew to stay visible.`,
      cta: { label: 'Keep my plan', to: ROUTES.vendor.subscription },
    };
  return null;
}
