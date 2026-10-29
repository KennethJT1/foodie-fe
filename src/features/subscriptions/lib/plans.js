import { SUBSCRIPTION_STATUS as S } from '@/constants/statuses';

const FEATURED = {
  none: 'Standard placement in search',
  occasional: 'Featured in search now and then',
  priority: 'Priority placement in search',
};

const ANALYTICS = {
  basic: 'Basic sales reports',
  full: 'Full sales and engagement reports',
  export: 'Full reports with CSV export',
};

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** What a plan includes, in plain words (BRD section 4). */
export function planFeatures(plan) {
  const { menuItems, photosPerItem, staff } = plan.limits;
  return [
    menuItems == null ? 'Unlimited menu items' : `Up to ${menuItems} menu items`,
    `${plural(photosPerItem, 'photo', 'photos')} per item`,
    plural(staff, 'staff login', 'staff logins'),
    FEATURED[plan.featured] ?? FEATURED.none,
    ANALYTICS[plan.analytics] ?? ANALYTICS.basic,
  ];
}

export const priceFor = (plan, interval) =>
  interval === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;

/** Naira saved per year by paying yearly. */
export const yearlySaving = (plan) => plan.monthlyPrice * 12 - plan.yearlyPrice;

/**
 * Which button a plan card shows for this vendor (BR-SUB-01/03):
 * trial | pay | upgrade | downgrade | current | scheduled.
 */
export function planAction(plan, interval, mine) {
  const sub = mine?.subscription;
  const status = mine?.status;
  if (!sub || status === S.NONE) {
    return mine?.trialAvailable
      ? { kind: 'trial', label: `Start ${mine.trialDays}-day free trial` }
      : { kind: 'pay', label: `Choose ${plan.name}` };
  }
  const isSamePlan = sub.planId === plan.id;
  if (status === S.ACTIVE) {
    if (isSamePlan && sub.interval === interval) return { kind: 'current', label: 'Current plan' };
    const next = sub.scheduledChange;
    if (next?.planId === plan.id && next.interval === interval)
      return { kind: 'scheduled', label: 'Starts at renewal' };
    const isUpgrade =
      plan.monthlyPrice > sub.plan.monthlyPrice ||
      (isSamePlan && interval === 'yearly' && sub.interval === 'monthly');
    return isUpgrade
      ? { kind: 'upgrade', label: `Upgrade to ${plan.name}` }
      : { kind: 'downgrade', label: 'Switch at renewal' };
  }
  // Trial, grace or expired: any plan is paid for now
  if (isSamePlan)
    return {
      kind: 'pay',
      label: status === S.TRIAL ? `Pay for ${plan.name}` : `Renew ${plan.name}`,
    };
  return { kind: 'pay', label: `Choose ${plan.name}` };
}

const DAY = 24 * 60 * 60 * 1000;

/** Whole days from now until `date` (0 when it has passed). */
export const daysUntil = (date, now = Date.now()) =>
  Math.max(0, Math.ceil((new Date(date).getTime() - now) / DAY));
