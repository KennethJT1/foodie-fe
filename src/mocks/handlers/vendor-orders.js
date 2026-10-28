import { http, HttpResponse } from 'msw';

import { ORDER_STATUS } from '@/constants/order-status';

import { db, findById, persist } from '../db';
import { updateOrderStatus } from '../realtime';
import { requireUser } from '../utils/auth';
import { applyListQuery } from '../utils/list';
import { expireOverdueOrders, rejectOrder, serializeOrder } from '../utils/orders';
import { api } from '../utils/path';
import { fail, latency, ok, readJson, validationError } from '../utils/respond';

const DAY = 24 * 60 * 60 * 1000;
const S = ORDER_STATUS;

/** Which status each vendor action needs first (BRD section 7). */
const ACTIONS = {
  accept: { from: S.PAID, to: S.ACCEPTED, done: 'accepted' },
  preparing: { from: S.ACCEPTED, to: S.PREPARING, done: 'marked as preparing' },
  ready: { from: S.PREPARING, to: S.READY_FOR_PICKUP, done: 'marked as ready' },
};

function vendorOrder(request, id) {
  const { user, error } = requireUser(request, { roles: ['vendor'] });
  if (error) return { error };
  expireOverdueOrders(user.vendorId);
  const order = findById('orders', id);
  if (!order || order.vendorId !== user.vendorId)
    return { error: fail(404, { message: "We couldn't find that order." }) };
  return { user, order };
}

const lagosDay = (iso) => new Date(new Date(iso).getTime() + 3600000).toISOString().slice(0, 10); // WAT is UTC+1

const counted = (o) => ![S.CANCELLED, S.REJECTED].includes(o.status);

export const vendorOrderHandlers = [
  ...Object.entries(ACTIONS).map(([action, { from, to, done }]) =>
    http.post(api(`/orders/:id/${action}`), async ({ request, params }) => {
      await latency();
      const { user, order, error } = vendorOrder(request, params.id);
      if (error) return error;
      if (order.status !== from) {
        const message =
          order.status === S.REJECTED && action === 'accept'
            ? 'This order was not accepted in time, so the customer was refunded.'
            : `This order can't be ${done} now. Refresh to see its latest status.`;
        return fail(409, { code: 'INVALID_STATUS', message });
      }
      updateOrderStatus(order, to, {}, 'vendor');
      persist();
      return ok(serializeOrder(order, user, { detail: true }));
    }),
  ),

  http.post(api('/orders/:id/reject'), async ({ request, params }) => {
    await latency();
    const { user, order, error } = vendorOrder(request, params.id);
    if (error) return error;
    if (![S.PAID, S.ACCEPTED].includes(order.status))
      return fail(409, {
        code: 'INVALID_STATUS',
        message: 'You can only reject an order before you start preparing it.',
      });
    const reason = String((await readJson(request)).reason ?? '').trim();
    if (!reason) return validationError({ reason: 'Tell the customer why' });
    rejectOrder(order, reason.slice(0, 200), 'vendor');
    persist();
    return ok(serializeOrder(order, user, { detail: true }));
  }),

  // Overview numbers (BRD section 8, vendor dashboard)
  http.get(api('/vendor/stats'), async ({ request }) => {
    await latency();
    const { user, error } = requireUser(request, { roles: ['vendor'] });
    if (error) return error;
    if (expireOverdueOrders(user.vendorId)) persist();
    const vendor = findById('vendors', user.vendorId);
    const days = Math.min(90, Number(new URL(request.url).searchParams.get('days')) || 14);
    const orders = db.orders.filter((o) => o.vendorId === vendor.id);
    const today = lagosDay(new Date().toISOString());
    const yesterday = lagosDay(new Date(Date.now() - DAY).toISOString());
    const onDay = (day) => orders.filter((o) => counted(o) && lagosDay(o.createdAt) === day);
    const sum = (list) => list.reduce((s, o) => s + o.subtotal, 0);
    const todays = onDay(today);
    const yesterdays = onDay(yesterday);
    const change = (a, b) => (b ? ((a - b) / b) * 100 : null);

    const series = Array.from({ length: days }, (_, i) => {
      const day = lagosDay(new Date(Date.now() - (days - 1 - i) * DAY).toISOString());
      const list = onDay(day);
      return { date: day, orders: list.length, sales: sum(list) };
    });
    const since = Date.now() - days * DAY;
    const tally = new Map();
    for (const o of orders) {
      if (!counted(o) || new Date(o.createdAt).getTime() < since) continue;
      for (const l of o.items) {
        const t = tally.get(l.foodItemId) ?? {
          foodItemId: l.foodItemId,
          name: l.name,
          quantity: 0,
          sales: 0,
        };
        t.quantity += l.quantity;
        t.sales += l.lineTotal;
        tally.set(l.foodItemId, t);
      }
    }
    return ok({
      today: {
        orders: todays.length,
        sales: sum(todays),
        ordersChange: change(todays.length, yesterdays.length),
        salesChange: change(sum(todays), sum(yesterdays)),
      },
      waiting: orders.filter((o) => o.status === S.PAID).length,
      inProgress: orders.filter((o) =>
        [S.ACCEPTED, S.PREPARING, S.READY_FOR_PICKUP, S.RIDER_ASSIGNED].includes(o.status),
      ).length,
      rating: vendor.rating,
      ratingCount: vendor.ratingCount,
      followersCount: vendor.followersCount,
      isPaused: vendor.isPaused,
      series,
      topItems: [...tally.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5),
    });
  }),

  // Money per order: the food subtotal goes straight to the vendor (BR-PAY-03/04)
  http.get(api('/vendor/sales'), async ({ request }) => {
    await latency();
    const { user, error } = requireUser(request, { roles: ['vendor'] });
    if (error) return error;
    const params = new URL(request.url).searchParams;
    const orders = new Map(db.orders.map((o) => [o.id, o]));
    const rows = db.payments
      .filter((p) => p.type === 'order' && p.vendorId === user.vendorId)
      .map((p) => {
        const o = orders.get(p.orderId);
        return {
          id: p.id,
          orderId: p.orderId,
          orderCode: o?.code ?? '',
          customerName: o?.customerName ?? '',
          amount: p.vendorShare,
          status: p.status,
          settlementStatus: p.status === 'refunded' ? 'refunded' : p.settlementStatus,
          reference: p.reference,
          createdAt: p.createdAt,
        };
      });
    const page = applyListQuery(rows, params, {
      searchFields: ['orderCode', 'customerName', 'reference'],
      filters: { settlementStatus: 'settlementStatus' },
    });
    // Summary over the whole filtered range, not just this page
    const all = applyListQuery(
      rows,
      new URLSearchParams({ ...Object.fromEntries(params), page: '1', limit: '100000' }),
      {
        searchFields: ['orderCode', 'customerName', 'reference'],
        filters: { settlementStatus: 'settlementStatus' },
      },
    ).data;
    const total = (status) =>
      all.filter((r) => r.settlementStatus === status).reduce((s, r) => s + r.amount, 0);
    return HttpResponse.json({
      success: true,
      data: page.data,
      meta: {
        ...page.meta,
        summary: {
          settling: total('settling'),
          settled: total('settled'),
          refunded: total('refunded'),
        },
      },
    });
  }),

  http.get(api('/vendor/sales/daily'), async ({ request }) => {
    await latency();
    const { user, error } = requireUser(request, { roles: ['vendor'] });
    if (error) return error;
    const days = Math.min(90, Number(new URL(request.url).searchParams.get('days')) || 30);
    const since = Date.now() - days * DAY;
    const byDay = new Map();
    for (const p of db.payments) {
      if (p.type !== 'order' || p.vendorId !== user.vendorId || p.status === 'refunded') continue;
      if (new Date(p.createdAt).getTime() < since) continue;
      const day = lagosDay(p.createdAt);
      const d = byDay.get(day) ?? { date: day, orders: 0, amount: 0, settling: 0, settled: 0 };
      d.orders += 1;
      d.amount += p.vendorShare;
      d[p.settlementStatus === 'settled' ? 'settled' : 'settling'] += p.vendorShare;
      byDay.set(day, d);
    }
    return ok([...byDay.values()].sort((a, b) => b.date.localeCompare(a.date)));
  }),
];
