import { db, findById } from '../db';
import { newId } from '../seed/seed';

const DAY = 24 * 60 * 60 * 1000;
export const PERIOD_DAYS = { monthly: 30, yearly: 365 };

/** 12 × monthly minus the admin-set yearly discount (BRD section 4). */
export const yearlyPriceOf = (plan) =>
  Math.round(plan.monthlyPrice * 12 * (1 - db.settings.yearlyDiscountPct / 100));

export const priceOf = (plan, interval) =>
  interval === 'yearly' ? yearlyPriceOf(plan) : plan.monthlyPrice;

export const serializePlan = (plan) => ({ ...plan, yearlyPrice: yearlyPriceOf(plan) });

export const vendorSubscription = (vendor) =>
  db.subscriptions.find((s) => s.id === vendor.subscriptionId) ??
  db.subscriptions.find((s) => s.vendorId === vendor.id) ??
  null;

/** What the vendor's subscription screen needs, with plan details attached. */
export function serializeSubscription(vendor) {
  const sub = vendorSubscription(vendor);
  const plan = sub && findById('plans', sub.planId);
  const scheduled = sub?.scheduledChange;
  return {
    status: vendor.subscriptionStatus,
    trialAvailable: !vendor.trialUsed && vendor.approvalStatus === 'approved',
    trialDays: db.settings.trialDays,
    graceDays: db.settings.graceDays,
    subscription: sub && {
      ...sub,
      status: vendor.subscriptionStatus,
      plan: plan && serializePlan(plan),
      amount: plan ? priceOf(plan, sub.interval) : 0,
      scheduledChange: scheduled && {
        ...scheduled,
        planName: findById('plans', scheduled.planId)?.name ?? '',
      },
    },
  };
}

/** Upgrade, renewal or first payment: how much to charge now (BR-SUB-03, prorated upgrades). */
export function quoteChange(vendor, plan, interval) {
  const sub = vendorSubscription(vendor);
  const full = priceOf(plan, interval);
  if (vendor.subscriptionStatus !== 'active' || !sub) return { kind: 'new', amount: full };
  const current = findById('plans', sub.planId);
  if (sub.planId === plan.id && sub.interval === interval) return { kind: 'same', amount: 0 };
  const isUpgrade =
    plan.monthlyPrice > current.monthlyPrice ||
    (plan.id === current.id && interval === 'yearly' && sub.interval === 'monthly');
  if (!isUpgrade) return { kind: 'downgrade', amount: 0 };
  // Credit for the unused part of the current period
  const start = new Date(sub.currentPeriodStart).getTime();
  const end = new Date(sub.currentPeriodEnd).getTime();
  const left = Math.max(0, Math.min(1, (end - Date.now()) / (end - start)));
  const credit = Math.round(priceOf(current, sub.interval) * left);
  return { kind: 'upgrade', amount: Math.max(10000, full - credit) };
}

/** Records a paid invoice and the matching platform payment (BR-PAY-05). */
export function recordSubscriptionPayment(vendor, sub, { amount, reference, interval, planId }) {
  const at = new Date().toISOString();
  db.invoices.unshift({
    id: newId('inv'),
    vendorId: vendor.id,
    subscriptionId: sub.id,
    planId,
    interval,
    amount,
    status: 'paid',
    reference,
    createdAt: at,
  });
  db.payments.unshift({
    id: newId('pay'),
    reference,
    type: 'subscription',
    vendorId: vendor.id,
    orderId: null,
    amount,
    vendorShare: 0,
    platformShare: amount,
    fee: Math.round(amount * 0.015),
    channel: 'card',
    status: 'success',
    settlementStatus: 'settling',
    reconciled: false,
    flag: null,
    createdAt: at,
  });
}

/** Puts the vendor on a paid plan from now (or keeps the period on a prorated upgrade). */
export function activateSubscription(vendor, { planId, interval, kind }) {
  const now = Date.now();
  let sub = vendorSubscription(vendor);
  if (!sub) {
    sub = { id: newId('sub'), vendorId: vendor.id, createdAt: new Date(now).toISOString() };
    db.subscriptions.push(sub);
    vendor.subscriptionId = sub.id;
  }
  const keepPeriod = kind === 'upgrade' && sub.interval === interval;
  Object.assign(sub, {
    planId,
    interval,
    status: 'active',
    currentPeriodStart: keepPeriod ? sub.currentPeriodStart : new Date(now).toISOString(),
    currentPeriodEnd: keepPeriod
      ? sub.currentPeriodEnd
      : new Date(now + PERIOD_DAYS[interval] * DAY).toISOString(),
    trialEndsAt: null,
    graceEndsAt: null,
    cancelAtPeriodEnd: false,
    scheduledChange: null,
  });
  vendor.planId = planId;
  vendor.subscriptionStatus = 'active';
  return sub;
}

/** BR-SUB-01: one free trial per business, after approval. */
export function startTrial(vendor, planId) {
  const now = Date.now();
  const ends = new Date(now + db.settings.trialDays * DAY).toISOString();
  const sub = {
    id: newId('sub'),
    vendorId: vendor.id,
    planId,
    interval: 'monthly',
    status: 'trial',
    currentPeriodStart: new Date(now).toISOString(),
    currentPeriodEnd: ends,
    trialEndsAt: ends,
    graceEndsAt: null,
    cancelAtPeriodEnd: false,
    scheduledChange: null,
    createdAt: new Date(now).toISOString(),
  };
  db.subscriptions.push(sub);
  Object.assign(vendor, {
    subscriptionId: sub.id,
    planId,
    subscriptionStatus: 'trial',
    trialUsed: true,
  });
  return sub;
}
