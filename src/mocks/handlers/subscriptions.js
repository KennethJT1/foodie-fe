import { http, HttpResponse } from 'msw';

import { db, findById, persist } from '../db';
import { notify, requireUser } from '../utils/auth';
import { applyListQuery, listResponse } from '../utils/list';
import { api } from '../utils/path';
import { fail, latency, ok, readJson, validationError } from '../utils/respond';
import {
  activateSubscription,
  quoteChange,
  recordSubscriptionPayment,
  serializePlan,
  serializeSubscription,
  startTrial,
  vendorSubscription,
} from '../utils/subscriptions';

const randomRef = () =>
  `SUB_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`.toUpperCase();

const pendingSubscriptionPayments = () => (db.pendingSubscriptionPayments ??= []);

/** The signed-in vendor owner's store, approved before any plan action. */
function ownVendor(request, { approved = true } = {}) {
  const { user, error } = requireUser(request, { roles: ['vendor'] });
  if (error) return { error };
  const vendor = findById('vendors', user.vendorId);
  if (!vendor) return { error: fail(404) };
  if (approved && vendor.approvalStatus !== 'approved')
    return {
      error: fail(409, {
        code: 'NOT_APPROVED',
        message: 'Your store needs to be approved before you pick a plan.',
      }),
    };
  return { user, vendor };
}

function readPlanChoice(body) {
  const plan = findById('plans', body.planId);
  const fieldErrors = {};
  if (!plan || plan.isRetired) fieldErrors.planId = 'Pick a plan';
  if (!['monthly', 'yearly'].includes(body.interval))
    fieldErrors.interval = 'Pick monthly or yearly';
  return { plan, fieldErrors };
}

export const subscriptionHandlers = [
  http.get(api('/plans'), async () => {
    await latency();
    const plans = db.plans
      .filter((p) => !p.isRetired)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(serializePlan);
    return HttpResponse.json({
      success: true,
      data: plans,
      meta: { trialDays: db.settings.trialDays, yearlyDiscountPct: db.settings.yearlyDiscountPct },
    });
  }),

  http.get(api('/vendor/subscription'), async ({ request }) => {
    await latency();
    const { vendor, error } = ownVendor(request, { approved: false });
    if (error) return error;
    return ok(serializeSubscription(vendor));
  }),

  http.get(api('/vendor/subscription/invoices'), async ({ request }) => {
    await latency();
    const { vendor, error } = ownVendor(request, { approved: false });
    if (error) return error;
    const plans = new Map(db.plans.map((p) => [p.id, p.name]));
    const rows = db.invoices
      .filter((i) => i.vendorId === vendor.id)
      .map((i) => ({ ...i, planName: plans.get(i.planId) ?? '' }));
    return listResponse(
      applyListQuery(rows, new URL(request.url).searchParams, {
        searchFields: ['reference', 'planName'],
        filters: { status: 'status' },
      }),
    );
  }),

  // BR-SUB-01: free trial once per business, after approval, no card needed
  http.post(api('/vendor/subscription/trial'), async ({ request }) => {
    await latency();
    const { user, vendor, error } = ownVendor(request);
    if (error) return error;
    const plan = findById('plans', (await readJson(request)).planId);
    if (!plan || plan.isRetired) return validationError({ planId: 'Pick a plan' });
    if (vendor.trialUsed || vendor.subscriptionStatus !== 'none')
      return fail(409, {
        code: 'TRIAL_USED',
        message: 'Your store has already used its free trial. Pick a plan to continue.',
      });
    startTrial(vendor, plan.id);
    notify(user.id, {
      type: 'subscription',
      title: `Your ${plan.name} trial has started`,
      body: `You have ${db.settings.trialDays} days free. We'll remind you before it ends.`,
      link: '/vendor/subscription',
    });
    persist();
    return ok(serializeSubscription(vendor));
  }),

  // First payment, renewal or prorated upgrade (BR-SUB-03). Paystack popup, then verify.
  http.post(api('/vendor/subscription/initialize'), async ({ request }) => {
    await latency();
    const { user, vendor, error } = ownVendor(request);
    if (error) return error;
    const body = await readJson(request);
    const { plan, fieldErrors } = readPlanChoice(body);
    if (Object.keys(fieldErrors).length) return validationError(fieldErrors);
    const quote = quoteChange(vendor, plan, body.interval);
    if (quote.kind === 'same')
      return fail(409, { code: 'SAME_PLAN', message: `You're already on ${plan.name}.` });
    if (quote.kind === 'downgrade')
      return fail(409, {
        code: 'DOWNGRADE_AT_RENEWAL',
        message: 'Smaller plans start at your next renewal. Use "Switch at renewal".',
      });
    const pending = {
      reference: randomRef(),
      accessCode: Math.random().toString(36).slice(2, 14),
      vendorId: vendor.id,
      planId: plan.id,
      interval: body.interval,
      kind: quote.kind,
      amount: quote.amount,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    pendingSubscriptionPayments().push(pending);
    persist();
    return ok({
      reference: pending.reference,
      accessCode: pending.accessCode,
      amount: pending.amount,
      kind: pending.kind,
      email: user.email ?? `${user.id}@vendors.kjtfoodie.test`,
    });
  }),

  // Idempotent: a second call returns the same subscription.
  http.post(api('/vendor/subscription/verify'), async ({ request }) => {
    await latency();
    const { user, vendor, error } = ownVendor(request);
    if (error) return error;
    const { reference } = await readJson(request);
    const pending = pendingSubscriptionPayments().find(
      (p) => p.reference === reference && p.vendorId === vendor.id,
    );
    if (!pending) return fail(404, { message: "We couldn't find that payment." });
    if (pending.status !== 'success') {
      const sub = activateSubscription(vendor, pending);
      recordSubscriptionPayment(vendor, sub, pending);
      pending.status = 'success';
      const plan = findById('plans', pending.planId);
      notify(user.id, {
        type: 'subscription',
        title: `You're on the ${plan.name} plan`,
        body: 'Payment received. Your store is visible to customers.',
        link: '/vendor/subscription',
      });
      persist();
    }
    return ok(serializeSubscription(vendor));
  }),

  // Downgrades wait for the next renewal (BR-SUB-03)
  http.post(api('/vendor/subscription/change'), async ({ request }) => {
    await latency();
    const { vendor, error } = ownVendor(request);
    if (error) return error;
    const body = await readJson(request);
    const { plan, fieldErrors } = readPlanChoice(body);
    if (Object.keys(fieldErrors).length) return validationError(fieldErrors);
    const quote = quoteChange(vendor, plan, body.interval);
    if (quote.kind !== 'downgrade')
      return fail(409, {
        code: 'PAYMENT_REQUIRED',
        message: 'This change needs a payment. Choose the plan to pay for it.',
      });
    vendorSubscription(vendor).scheduledChange = { planId: plan.id, interval: body.interval };
    persist();
    return ok(serializeSubscription(vendor));
  }),

  // BR-SUB-02: cancel any time, keep access until the period ends
  http.post(api('/vendor/subscription/cancel'), async ({ request }) => {
    await latency();
    const { vendor, error } = ownVendor(request);
    if (error) return error;
    const sub = vendorSubscription(vendor);
    if (!sub || !['active', 'trial'].includes(vendor.subscriptionStatus))
      return fail(409, { message: 'There is no running plan to cancel.' });
    sub.cancelAtPeriodEnd = true;
    persist();
    return ok(serializeSubscription(vendor));
  }),

  http.post(api('/vendor/subscription/resume'), async ({ request }) => {
    await latency();
    const { vendor, error } = ownVendor(request);
    if (error) return error;
    const sub = vendorSubscription(vendor);
    if (!sub || !['active', 'trial'].includes(vendor.subscriptionStatus))
      return fail(409, { message: 'This plan has already ended. Renew it instead.' });
    sub.cancelAtPeriodEnd = false;
    persist();
    return ok(serializeSubscription(vendor));
  }),
];
