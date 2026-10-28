import { http, HttpResponse } from 'msw';

import { ADMIN_ROLE_PERMISSIONS, PERMISSIONS as P } from '@/constants/permissions';
import { ADMIN_ROLES } from '@/constants/roles';

import { db, findById, persist } from '../db';
import { DEMO_PASSWORD, newId } from '../seed/seed';
import { audit, notify, permissionsFor, requireUser } from '../utils/auth';
import { applyListQuery, listResponse } from '../utils/list';
import { api } from '../utils/path';
import { created, fail, latency, ok, readJson, validationError } from '../utils/respond';
import { serializePlan, vendorSubscription } from '../utils/subscriptions';

const DAY = 24 * 60 * 60 * 1000;
const admin = (request, permission) => requireUser(request, { roles: ['admin'], permission });
const params = (request) => new URL(request.url).searchParams;
const text = (v, max = 500) =>
  String(v ?? '')
    .trim()
    .slice(0, max);

// ── Payments ─────────────────────────────────────────────────────────────────
function paymentRow(p, vendors, orders) {
  const o = p.orderId ? orders.get(p.orderId) : null;
  return {
    id: p.id,
    reference: p.reference,
    type: p.type,
    orderId: p.orderId,
    orderCode: o?.code ?? null,
    vendorName: vendors.get(p.vendorId)?.name ?? '',
    amount: p.amount,
    vendorShare: p.vendorShare,
    platformShare: p.platformShare,
    fee: p.fee,
    channel: p.channel,
    status: p.status,
    settlementStatus: p.settlementStatus,
    reconciled: p.reconciled,
    flag: p.flag,
    createdAt: p.createdAt,
  };
}

// ── Moderation ──────────────────────────────────────────────────────────────
function reportRow(r, users) {
  const reporter = users.get(r.reporterId);
  let target = null;
  if (r.targetType === 'comment') {
    const c = findById('comments', r.targetId);
    const item = c && findById('foodItems', c.foodItemId);
    target = c && {
      body: c.body,
      authorName: users.get(c.userId)?.name ?? 'Customer',
      foodItemName: item?.name ?? '',
      foodItemId: item?.id ?? null,
      isHidden: c.hidden,
      isRemoved: c.removed,
    };
  } else {
    const f = findById('foodItems', r.targetId);
    target = f && {
      name: f.name,
      photo: f.photos[0] ?? null,
      vendorName: findById('vendors', f.vendorId)?.name ?? '',
      foodItemId: f.id,
      isHidden: f.isHidden,
    };
  }
  return { ...r, reporterName: reporter?.name ?? 'Customer', target };
}

// ── Support ─────────────────────────────────────────────────────────────────
const ticketRow = ({ messages, ...t }) => ({
  ...t,
  lastMessage: messages.filter((m) => !m.internal).at(-1)?.body ?? '',
  messageCount: messages.length,
});

// ── Settings ────────────────────────────────────────────────────────────────
const NUMBER_RULES = {
  deliveryBaseFee: [0, 1_000_000, 'base fee'],
  deliveryPerKm: [0, 500_000, 'fee per km'],
  deliveryMaxFee: [0, 5_000_000, 'maximum fee'],
  riderPayoutPct: [0, 100, 'rider payout %'],
  vendorAcceptTimeoutSec: [60, 1800, 'accept timeout'],
  riderOfferTimeoutSec: [10, 120, 'offer timeout'],
  trialDays: [0, 90, 'trial length'],
  graceDays: [0, 14, 'grace period'],
  yearlyDiscountPct: [0, 50, 'yearly discount'],
  refundDeadlineHours: [1, 168, 'refund deadline'],
  processingFeePct: [0, 10, 'processing fee %'],
};

// ── Admin users ─────────────────────────────────────────────────────────────
const adminRow = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  adminRole: u.adminRole,
  status: u.status,
  createdAt: u.createdAt,
});

export const adminOpsHandlers = [
  // ── Payments: transactions, split, settlement, reconciliation (BR-PAY-08) ──
  http.get(api('/admin/payments'), async ({ request }) => {
    await latency();
    const { error } = admin(request, P.PAYMENTS_VIEW);
    if (error) return error;
    const vendors = new Map(db.vendors.map((v) => [v.id, v]));
    const orders = new Map(db.orders.map((o) => [o.id, o]));
    const config = {
      searchFields: ['reference', 'vendorName', 'orderCode'],
      filters: {
        type: 'type',
        status: 'status',
        settlementStatus: 'settlementStatus',
        channel: 'channel',
        flagged: (p, [v]) => (v === 'true' ? Boolean(p.flag) : true),
      },
    };
    const rows = db.payments.map((p) => paymentRow(p, vendors, orders));
    const page = applyListQuery(rows, params(request), config);
    const all = applyListQuery(
      rows,
      new URLSearchParams({ ...Object.fromEntries(params(request)), page: '1', limit: '100000' }),
      config,
    ).data;
    const sum = (k) => all.filter((r) => r.status === 'success').reduce((s, r) => s + r[k], 0);
    return HttpResponse.json({
      success: true,
      data: page.data,
      meta: {
        ...page.meta,
        summary: {
          amount: sum('amount'),
          vendorShare: sum('vendorShare'),
          platformShare: sum('platformShare'),
          fee: sum('fee'),
          flagged: all.filter((r) => r.flag).length,
        },
      },
    });
  }),

  http.post(api('/admin/payments/:id/reconcile'), async ({ request, params: p }) => {
    await latency();
    const { user, error } = admin(request, P.PAYMENTS_VIEW);
    if (error) return error;
    const payment = findById('payments', p.id);
    if (!payment) return fail(404);
    const note = text((await readJson(request)).note);
    if (!note) return validationError({ note: 'Say how you checked it' });
    const flag = payment.flag;
    Object.assign(payment, { flag: null, reconciled: true, reconcileNote: note });
    audit(
      user,
      'payment.reconciled',
      'payment',
      payment.id,
      `${payment.reference}: cleared ${flag ?? 'flag'} (${note})`,
    );
    persist();
    return ok({ id: payment.id, flag: null, reconciled: true });
  }),

  // ── Plans and prices (BR-SUB-07) ──────────────────────────────────────────
  http.get(api('/admin/plans'), async ({ request }) => {
    await latency();
    const { error } = admin(request, P.SUBSCRIPTIONS_VIEW);
    if (error) return error;
    const counts = new Map();
    for (const v of db.vendors)
      if (['trial', 'active', 'grace'].includes(v.subscriptionStatus))
        counts.set(v.planId, (counts.get(v.planId) ?? 0) + 1);
    return HttpResponse.json({
      success: true,
      data: [...db.plans]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((pl) => ({ ...serializePlan(pl), vendorCount: counts.get(pl.id) ?? 0 })),
      meta: { trialDays: db.settings.trialDays, yearlyDiscountPct: db.settings.yearlyDiscountPct },
    });
  }),

  ...['post', 'patch'].map((method) =>
    http[method](
      api(method === 'post' ? '/admin/plans' : '/admin/plans/:id'),
      async ({ request, params: p }) => {
        await latency();
        const { user, error } = admin(request, P.SUBSCRIPTIONS_MANAGE);
        if (error) return error;
        const plan = method === 'patch' ? findById('plans', p.id) : null;
        if (method === 'patch' && !plan) return fail(404);
        const body = await readJson(request);
        const errors = {};
        const name = body.name !== undefined ? text(body.name, 40) : plan?.name;
        if (!name || name.length < 2) errors.name = 'Name the plan';
        else if (
          db.plans.some((x) => x.id !== plan?.id && x.name.toLowerCase() === name.toLowerCase())
        )
          errors.name = 'Another plan has that name';
        const monthlyPrice =
          body.monthlyPrice !== undefined
            ? Math.round(Number(body.monthlyPrice))
            : plan?.monthlyPrice;
        if (!(monthlyPrice > 0)) errors.monthlyPrice = 'Price must be more than ₦0';
        const limits = {
          ...(plan?.limits ?? { menuItems: 20, photosPerItem: 1, staff: 1 }),
          ...(body.limits ?? {}),
        };
        if (limits.menuItems !== null && !(Number(limits.menuItems) >= 1))
          errors['limits.menuItems'] = 'At least 1, or unlimited';
        if (!(Number(limits.photosPerItem) >= 1 && Number(limits.photosPerItem) <= 10))
          errors['limits.photosPerItem'] = 'Between 1 and 10';
        if (!(Number(limits.staff) >= 1)) errors['limits.staff'] = 'At least 1';
        if (Object.keys(errors).length) return validationError(errors);
        const fields = {
          name,
          monthlyPrice,
          limits: {
            menuItems: limits.menuItems === null ? null : Number(limits.menuItems),
            photosPerItem: Number(limits.photosPerItem),
            staff: Number(limits.staff),
          },
          featured: body.featured ?? plan?.featured ?? 'none',
          analytics: body.analytics ?? plan?.analytics ?? 'basic',
          isPopular: body.isPopular ?? plan?.isPopular ?? false,
          isRetired: body.isRetired ?? plan?.isRetired ?? false,
        };
        let saved = plan;
        if (plan) Object.assign(plan, fields);
        else {
          saved = {
            id: newId('plan'),
            sortOrder: Math.max(...db.plans.map((x) => x.sortOrder)) + 1,
            ...fields,
          };
          db.plans.push(saved);
        }
        if (saved.isPopular) for (const x of db.plans) if (x.id !== saved.id) x.isPopular = false;
        audit(
          user,
          plan ? 'plan.updated' : 'plan.created',
          'plan',
          saved.id,
          `${saved.name}: ₦${(saved.monthlyPrice / 100).toLocaleString()} a month${saved.isRetired ? ' (retired)' : ''}`,
        );
        persist();
        return plan ? ok(serializePlan(saved)) : created(serializePlan(saved));
      },
    ),
  ),

  // ── Subscriptions (trial, active, grace, expired) ─────────────────────────
  http.get(api('/admin/subscriptions'), async ({ request }) => {
    await latency();
    const { error } = admin(request, P.SUBSCRIPTIONS_VIEW);
    if (error) return error;
    const rows = db.vendors
      .filter((v) => v.subscriptionStatus !== 'none')
      .map((v) => {
        const sub = vendorSubscription(v);
        const plan = findById('plans', sub?.planId ?? v.planId);
        return {
          id: sub?.id ?? v.id,
          vendorId: v.id,
          vendorName: v.name,
          planId: plan?.id ?? null,
          planName: plan?.name ?? '',
          interval: sub?.interval ?? 'monthly',
          status: v.subscriptionStatus,
          cancelAtPeriodEnd: Boolean(sub?.cancelAtPeriodEnd),
          currentPeriodEnd: sub?.currentPeriodEnd ?? null,
          trialEndsAt: sub?.trialEndsAt ?? null,
          graceEndsAt: sub?.graceEndsAt ?? null,
        };
      });
    return listResponse(
      applyListQuery(rows, params(request), {
        searchFields: ['vendorName', 'planName'],
        filters: { status: 'status', planId: 'planId', interval: 'interval' },
        dateField: 'currentPeriodEnd',
        defaultSort: 'currentPeriodEnd',
      }),
    );
  }),

  // BR-SUB-07: complimentary extension, logged
  http.post(api('/admin/subscriptions/:id/extend'), async ({ request, params: p }) => {
    await latency();
    const { user, error } = admin(request, P.SUBSCRIPTIONS_MANAGE);
    if (error) return error;
    const sub = findById('subscriptions', p.id);
    if (!sub) return fail(404);
    const vendor = findById('vendors', sub.vendorId);
    const body = await readJson(request);
    const days = Math.round(Number(body.days));
    const reason = text(body.reason);
    const errors = {};
    if (!(days >= 1 && days <= 365)) errors.days = 'Between 1 and 365 days';
    if (!reason) errors.reason = 'Give a reason';
    if (Object.keys(errors).length) return validationError(errors);
    const base = Math.max(Date.now(), new Date(sub.currentPeriodEnd).getTime());
    sub.currentPeriodEnd = new Date(base + days * DAY).toISOString();
    if (vendor.subscriptionStatus === 'trial') sub.trialEndsAt = sub.currentPeriodEnd;
    if (['expired', 'grace'].includes(vendor.subscriptionStatus)) {
      vendor.subscriptionStatus = 'active';
      sub.status = 'active';
      sub.graceEndsAt = null;
    }
    audit(
      user,
      'subscription.extended',
      'subscription',
      sub.id,
      `${vendor.name}: +${days} days (${reason})`,
    );
    notify(vendor.ownerId, {
      type: 'subscription',
      title: `We added ${days} days to your plan`,
      body: `Your plan now runs until ${sub.currentPeriodEnd.slice(0, 10)}.`,
      link: '/vendor/subscription',
    });
    persist();
    return ok({
      id: sub.id,
      status: vendor.subscriptionStatus,
      currentPeriodEnd: sub.currentPeriodEnd,
    });
  }),

  // ── Rider payout statements (BR-PAY-06) ───────────────────────────────────
  http.get(api('/admin/payouts'), async ({ request }) => {
    await latency();
    const { error } = admin(request, P.PAYOUTS_MANAGE);
    if (error) return error;
    return listResponse(
      applyListQuery(db.payoutStatements, params(request), {
        searchFields: ['riderName', 'reference'],
        filters: { status: 'status', month: 'month' },
        defaultSort: '-month',
      }),
    );
  }),

  ...['approve', 'mark-paid'].map((action) =>
    http.post(api(`/admin/payouts/:id/${action}`), async ({ request, params: p }) => {
      await latency();
      const { user, error } = admin(request, P.PAYOUTS_MANAGE);
      if (error) return error;
      const s = findById('payoutStatements', p.id);
      if (!s) return fail(404);
      const rider = findById('riders', s.riderId);
      const now = new Date().toISOString();
      if (action === 'approve') {
        if (s.status !== 'draft')
          return fail(409, { message: 'Only draft statements can be approved.' });
        Object.assign(s, { status: 'approved', approvedAt: now, approvedBy: user.name });
      } else {
        if (s.status !== 'approved')
          return fail(409, { message: 'Approve the statement before you mark it paid.' });
        const reference = text((await readJson(request)).reference, 60);
        if (reference.length < 4)
          return validationError({ reference: 'Enter the bank transfer reference' });
        Object.assign(s, { status: 'paid', paidAt: now, reference });
        notify(rider?.userId, {
          type: 'payout',
          title: 'Your payout has been sent',
          body: `₦${(s.amount / 100).toLocaleString()} for ${s.month}. Reference ${reference}.`,
          link: '/rider/earnings',
        });
      }
      audit(
        user,
        action === 'approve' ? 'payout.approved' : 'payout.marked_paid',
        'payout',
        s.id,
        `${s.riderName} ${s.month}: ₦${(s.amount / 100).toLocaleString()}`,
      );
      persist();
      return ok(s);
    }),
  ),

  // ── Refunds: comment and escalate (BR-REF-05) ─────────────────────────────
  http.post(api('/refunds/:id/comments'), async ({ request, params: p }) => {
    await latency();
    const { user, error } = admin(request, P.REFUNDS_VIEW);
    if (error) return error;
    const refund = findById('refunds', p.id);
    if (!refund) return fail(404);
    const body = text((await readJson(request)).body);
    if (!body) return validationError({ body: 'Write a comment first' });
    refund.comments.push({
      id: newId('rcm'),
      authorId: user.id,
      authorName: user.name,
      body,
      createdAt: new Date().toISOString(),
    });
    persist();
    return ok(refund);
  }),

  http.post(api('/refunds/:id/escalate'), async ({ request, params: p }) => {
    await latency();
    const { user, error } = admin(request, P.REFUNDS_ESCALATE);
    if (error) return error;
    const refund = findById('refunds', p.id);
    if (!refund) return fail(404);
    if (['confirmed', 'escalated'].includes(refund.status))
      return fail(409, { message: 'This refund is already closed or escalated.' });
    const reason = text((await readJson(request)).reason);
    if (!reason) return validationError({ reason: 'Give a reason' });
    refund.status = 'escalated';
    refund.escalated = true;
    refund.timeline.push({
      status: 'escalated',
      at: new Date().toISOString(),
      by: 'admin',
      note: reason,
    });
    const vendor = findById('vendors', refund.vendorId);
    notify(vendor?.ownerId, {
      type: 'refund',
      title: 'A refund was escalated',
      body: `Order KJT-${refund.orderCode}: ${reason}`,
      link: `/vendor/refunds/${refund.id}`,
    });
    notify(refund.customerId, {
      type: 'refund',
      title: "We're looking into your refund",
      body: 'Our team has stepped in. We will update you soon.',
      link: `/account/refunds/${refund.id}`,
    });
    audit(user, 'refund.escalated', 'refund', refund.id, `KJT-${refund.orderCode}: ${reason}`);
    persist();
    return ok(refund);
  }),

  // ── Moderation queue ──────────────────────────────────────────────────────
  http.get(api('/admin/reports'), async ({ request }) => {
    await latency();
    const { error } = admin(request, P.MODERATION_MANAGE);
    if (error) return error;
    const users = new Map(db.users.map((u) => [u.id, u]));
    return listResponse(
      applyListQuery(
        db.reports.map((r) => reportRow(r, users)),
        params(request),
        {
          searchFields: ['reason', 'reporterName'],
          filters: { status: 'status', targetType: 'targetType' },
        },
      ),
    );
  }),

  http.post(api('/admin/reports/:id/resolve'), async ({ request, params: p }) => {
    await latency();
    const { user, error } = admin(request, P.MODERATION_MANAGE);
    if (error) return error;
    const report = findById('reports', p.id);
    if (!report) return fail(404);
    if (report.status !== 'open')
      return fail(409, { message: 'This report has already been handled.' });
    const { action } = await readJson(request);
    if (!['hide', 'remove', 'dismiss'].includes(action))
      return validationError({ action: 'Pick an action' });
    const target = findById(
      report.targetType === 'comment' ? 'comments' : 'foodItems',
      report.targetId,
    );
    if (target && action !== 'dismiss') {
      if (report.targetType === 'comment') target[action === 'hide' ? 'hidden' : 'removed'] = true;
      else {
        target.isHidden = true;
        const vendor = findById('vendors', target.vendorId);
        notify(vendor?.ownerId, {
          type: 'moderation',
          title: `${target.name} was ${action === 'hide' ? 'hidden' : 'removed'}`,
          body: `People reported it: ${report.reason}. Contact support if you think this is a mistake.`,
          link: '/vendor/menu',
        });
      }
    }
    // Other open reports on the same thing are settled too
    for (const r of db.reports)
      if (
        r.status === 'open' &&
        r.targetType === report.targetType &&
        r.targetId === report.targetId
      ) {
        r.status = action === 'dismiss' ? 'dismissed' : 'resolved';
        r.action = action;
        r.resolvedAt = new Date().toISOString();
        r.resolvedBy = user.name;
      }
    audit(
      user,
      `${report.targetType === 'comment' ? 'comment' : 'food_item'}.${action === 'dismiss' ? 'report_dismissed' : action === 'hide' ? 'hidden' : 'removed'}`,
      report.targetType,
      report.targetId,
      report.reason,
    );
    persist();
    return ok(reportRow(report, new Map(db.users.map((u) => [u.id, u]))));
  }),

  // ── Support inbox ─────────────────────────────────────────────────────────
  http.get(api('/admin/tickets'), async ({ request }) => {
    await latency();
    const { user, error } = admin(request, P.SUPPORT_MANAGE);
    if (error) return error;
    return listResponse(
      applyListQuery(db.tickets.map(ticketRow), params(request), {
        searchFields: ['subject', 'userName', 'number', 'orderCode'],
        filters: {
          status: 'status',
          priority: 'priority',
          userRole: 'userRole',
          assignee: (t, [v]) =>
            v === 'me'
              ? t.assigneeId === user.id
              : v === 'none'
                ? !t.assigneeId
                : t.assigneeId === v,
        },
        dateField: 'updatedAt',
        defaultSort: '-updatedAt',
      }),
    );
  }),

  http.get(api('/admin/tickets/:id'), async ({ request, params: p }) => {
    await latency();
    const { error } = admin(request, P.SUPPORT_MANAGE);
    if (error) return error;
    const t = findById('tickets', p.id);
    return t ? ok(t) : fail(404);
  }),

  http.patch(api('/admin/tickets/:id'), async ({ request, params: p }) => {
    await latency();
    const { user, error } = admin(request, P.SUPPORT_MANAGE);
    if (error) return error;
    const t = findById('tickets', p.id);
    if (!t) return fail(404);
    const body = await readJson(request);
    if (body.status !== undefined) {
      if (!['open', 'pending', 'resolved', 'closed'].includes(body.status))
        return validationError({ status: 'Pick a status' });
      t.status = body.status;
    }
    if (body.priority !== undefined) t.priority = body.priority;
    if (body.assigneeId !== undefined) {
      const agent = body.assigneeId && findById('users', body.assigneeId);
      if (body.assigneeId && (!agent || !permissionsFor(agent).includes(P.SUPPORT_MANAGE)))
        return validationError({ assigneeId: 'Pick a support agent' });
      t.assigneeId = agent?.id ?? null;
      t.assigneeName = agent?.name ?? null;
    }
    t.updatedAt = new Date().toISOString();
    audit(user, 'ticket.updated', 'ticket', t.id, `#${t.number}: ${Object.keys(body).join(', ')}`);
    persist();
    return ok(t);
  }),

  http.post(api('/admin/tickets/:id/messages'), async ({ request, params: p }) => {
    await latency();
    const { user, error } = admin(request, P.SUPPORT_MANAGE);
    if (error) return error;
    const t = findById('tickets', p.id);
    if (!t) return fail(404);
    const body = await readJson(request);
    const message = text(body.body, 2000);
    if (!message) return validationError({ body: 'Write a reply first' });
    const at = new Date().toISOString();
    t.messages.push({
      id: newId('msg'),
      authorId: user.id,
      authorName: user.name,
      authorRole: 'admin',
      body: message,
      internal: Boolean(body.internal),
      createdAt: at,
    });
    t.updatedAt = at;
    if (!t.assigneeId) Object.assign(t, { assigneeId: user.id, assigneeName: user.name });
    if (!body.internal) {
      if (t.status === 'open') t.status = 'pending';
      const home = {
        customer: '/account/support',
        vendor: '/vendor/support',
        rider: '/rider/support',
      }[t.userRole];
      notify(t.userId, {
        type: 'support',
        title: `Reply on ticket #${t.number}`,
        body: message.slice(0, 80),
        link: home,
      });
    }
    persist();
    return ok(t);
  }),

  http.get(api('/admin/agents'), async ({ request }) => {
    await latency();
    const { error } = admin(request, P.SUPPORT_MANAGE);
    if (error) return error;
    return ok(
      db.users
        .filter(
          (u) =>
            u.role === 'admin' &&
            u.status === 'active' &&
            permissionsFor(u).includes(P.SUPPORT_MANAGE),
        )
        .map((u) => ({ id: u.id, name: u.name })),
    );
  }),

  // ── Platform settings ─────────────────────────────────────────────────────
  http.get(api('/admin/settings'), async ({ request }) => {
    await latency();
    const { error } = admin(request, P.SETTINGS_MANAGE);
    if (error) return error;
    return ok(db.settings);
  }),

  http.patch(api('/admin/settings'), async ({ request }) => {
    await latency();
    const { user, error } = admin(request, P.SETTINGS_MANAGE);
    if (error) return error;
    const body = await readJson(request);
    const errors = {};
    const patch = {};
    for (const [key, [min, max, label]] of Object.entries(NUMBER_RULES)) {
      if (body[key] === undefined) continue;
      const n = Number(body[key]);
      if (!Number.isFinite(n) || n < min || n > max)
        errors[key] = `Enter a ${label} between ${min} and ${max}`;
      else patch[key] = n;
    }
    if (body.refundMissedAction !== undefined) {
      if (!['escalate', 'warn', 'suspend'].includes(body.refundMissedAction))
        errors.refundMissedAction = 'Pick an action';
      else patch.refundMissedAction = body.refundMissedAction;
    }
    if (body.serviceAreas !== undefined) {
      const areas = [...new Set((body.serviceAreas ?? []).map((a) => text(a, 40)).filter(Boolean))];
      if (!areas.length) errors.serviceAreas = 'Keep at least one city';
      else patch.serviceAreas = areas;
    }
    if (body.notificationTemplates !== undefined) {
      const templates = body.notificationTemplates;
      templates.forEach((t, i) => {
        if (!text(t.body, 1000)) errors[`notificationTemplates.${i}.body`] = 'Write the message';
      });
      patch.notificationTemplates = templates.map((t) => ({
        key: t.key,
        channel: t.channel,
        subject: text(t.subject, 120),
        body: text(t.body, 1000),
      }));
    }
    if (
      (patch.deliveryMaxFee ?? db.settings.deliveryMaxFee) <
      (patch.deliveryBaseFee ?? db.settings.deliveryBaseFee)
    )
      errors.deliveryMaxFee = 'The maximum fee must be at least the base fee';
    if (Object.keys(errors).length) return validationError(errors);
    const changed = Object.keys(patch).filter(
      (k) => JSON.stringify(patch[k]) !== JSON.stringify(db.settings[k]),
    );
    Object.assign(db.settings, patch);
    if (changed.length)
      audit(user, 'settings.updated', 'settings', 'platform', `Changed ${changed.join(', ')}`);
    persist();
    return ok(db.settings);
  }),

  // ── Admin users and roles ─────────────────────────────────────────────────
  http.get(api('/admin/users'), async ({ request }) => {
    await latency();
    const { error } = admin(request, P.ADMIN_USERS_MANAGE);
    if (error) return error;
    return listResponse(
      applyListQuery(db.users.filter((u) => u.role === 'admin').map(adminRow), params(request), {
        searchFields: ['name', 'email'],
        filters: { adminRole: 'adminRole', status: 'status' },
        defaultSort: 'name',
      }),
    );
  }),

  http.post(api('/admin/users'), async ({ request }) => {
    await latency();
    const { user, error } = admin(request, P.ADMIN_USERS_MANAGE);
    if (error) return error;
    const body = await readJson(request);
    const errors = {};
    const firstName = text(body.firstName, 40);
    const lastName = text(body.lastName, 40);
    const email = text(body.email, 120).toLowerCase();
    if (firstName.length < 2) errors.firstName = 'Enter their first name';
    if (lastName.length < 2) errors.lastName = 'Enter their last name';
    if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Enter a valid email address';
    else if (db.users.some((u) => u.email === email))
      errors.email = 'That email already has an account';
    if (!Object.values(ADMIN_ROLES).includes(body.adminRole)) errors.adminRole = 'Pick a role';
    if (Object.keys(errors).length) return validationError(errors);
    const added = {
      id: newId('usr'),
      role: 'admin',
      adminRole: body.adminRole,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email,
      phone: null,
      password: DEMO_PASSWORD,
      avatar: null,
      status: 'active',
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };
    db.users.push(added);
    audit(user, 'admin_user.created', 'user', added.id, `${added.name} added as ${body.adminRole}`);
    persist();
    return created(adminRow(added));
  }),

  http.patch(api('/admin/users/:id'), async ({ request, params: p }) => {
    await latency();
    const { user, error } = admin(request, P.ADMIN_USERS_MANAGE);
    if (error) return error;
    const target = findById('users', p.id);
    if (!target || target.role !== 'admin') return fail(404);
    if (target.id === user.id)
      return fail(409, { message: "You can't change your own role or access." });
    const body = await readJson(request);
    if (body.adminRole !== undefined) {
      if (!Object.values(ADMIN_ROLES).includes(body.adminRole))
        return validationError({ adminRole: 'Pick a role' });
      target.adminRole = body.adminRole;
    }
    if (body.status !== undefined) {
      if (!['active', 'suspended'].includes(body.status))
        return validationError({ status: 'Pick a status' });
      target.status = body.status;
    }
    audit(
      user,
      'admin_user.updated',
      'user',
      target.id,
      `${target.name}: ${[body.adminRole, body.status].filter(Boolean).join(', ')}`,
    );
    persist();
    return ok(adminRow(target));
  }),

  http.get(api('/admin/roles'), async ({ request }) => {
    await latency();
    const { error } = admin(request, P.ADMIN_USERS_MANAGE);
    if (error) return error;
    return ok({ roles: db.adminRoles, permissions: Object.values(P) });
  }),

  http.patch(api('/admin/roles/:id'), async ({ request, params: p }) => {
    await latency();
    const { user, error } = admin(request, P.ADMIN_USERS_MANAGE);
    if (error) return error;
    const role = db.adminRoles.find((r) => r.id === p.id);
    if (!role) return fail(404);
    if (role.id === ADMIN_ROLES.SUPER_ADMIN)
      return fail(409, { message: 'The super admin role always has every permission.' });
    const { permissions } = await readJson(request);
    const valid = Object.values(P);
    if (!Array.isArray(permissions) || permissions.some((x) => !valid.includes(x)))
      return validationError({ permissions: 'Pick permissions from the list' });
    if (!permissions.includes(P.DASHBOARD_VIEW))
      return validationError({ permissions: 'Every role needs the overview' });
    const added = permissions.filter((x) => !role.permissions.includes(x));
    const removed = role.permissions.filter((x) => !permissions.includes(x));
    role.permissions = [...permissions];
    audit(
      user,
      'role.updated',
      'role',
      role.id,
      `${role.id}: +${added.join(', ') || 'none'} −${removed.join(', ') || 'none'}`,
    );
    persist();
    return ok(role);
  }),

  http.post(api('/admin/roles/:id/reset'), async ({ request, params: p }) => {
    await latency();
    const { user, error } = admin(request, P.ADMIN_USERS_MANAGE);
    if (error) return error;
    const role = db.adminRoles.find((r) => r.id === p.id);
    if (!role) return fail(404);
    role.permissions = [...ADMIN_ROLE_PERMISSIONS[role.id]];
    audit(user, 'role.reset', 'role', role.id, `${role.id} back to defaults`);
    persist();
    return ok(role);
  }),

  // ── Audit log ─────────────────────────────────────────────────────────────
  http.get(api('/admin/audit-log'), async ({ request }) => {
    await latency();
    const { error } = admin(request, P.AUDIT_LOG_VIEW);
    if (error) return error;
    return listResponse(
      applyListQuery(db.auditLog, params(request), {
        searchFields: ['summary', 'actorName', 'action', 'targetId'],
        filters: {
          actorRole: 'actorRole',
          targetType: 'targetType',
          action: (r, values) => values.some((v) => r.action.startsWith(v)),
        },
      }),
    );
  }),
];
