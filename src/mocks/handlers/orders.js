import { http } from 'msw';

import { ACTIVE_ORDER_STATUSES, ORDER_STATUS } from '@/constants/order-status';

import { db, findById, persist } from '../db';
import { notify, requireUser } from '../utils/auth';
import { applyListQuery, listResponse } from '../utils/list';
import { canSeeOrder, expireOverdueOrders, ordersFor, serializeOrder } from '../utils/orders';
import { api } from '../utils/path';
import { chaos, fail, latency, ok, readJson } from '../utils/respond';

export const orderHandlers = [
  // Role-scoped: customers see their own, vendors their store's, riders their trips, admins all
  http.get(api('/orders'), async ({ request }) => {
    await latency();
    const failure = chaos();
    if (failure) return failure;
    const { user, error } = requireUser(request);
    if (error) return error;
    if (user.role === 'vendor' && expireOverdueOrders(user.vendorId)) persist();
    const params = new URL(request.url).searchParams;
    const photos = new Map(db.foodItems.map((f) => [f.id, f.photos?.[0] ?? null]));
    const page = applyListQuery(ordersFor(user), params, {
      searchFields: ['code', 'vendorName', 'customerName'],
      filters: {
        status: 'status',
        vendorId: 'vendorId',
        customerId: 'customerId',
        riderId: 'riderId',
        active: (o, [v]) =>
          v === 'true'
            ? ACTIVE_ORDER_STATUSES.includes(o.status)
            : v === 'false'
              ? !ACTIVE_ORDER_STATUSES.includes(o.status)
              : true,
      },
    });
    return listResponse({
      ...page,
      data: page.data.map((o) => serializeOrder(o, user, { photos })),
    });
  }),

  http.get(api('/orders/:id'), async ({ request, params }) => {
    await latency();
    const failure = chaos();
    if (failure) return failure;
    const { user, error } = requireUser(request);
    if (error) return error;
    if (user.role === 'vendor' && expireOverdueOrders(user.vendorId)) persist();
    const order = findById('orders', params.id);
    if (!order || !canSeeOrder(user, order))
      return fail(404, { message: "We couldn't find that order." });
    return ok(serializeOrder(order, user, { detail: true }));
  }),

  // FR-ORD-05: the customer can cancel until the vendor accepts
  http.post(api('/orders/:id/cancel'), async ({ request, params }) => {
    await latency();
    const { user, error } = requireUser(request, { roles: ['customer'] });
    if (error) return error;
    const order = findById('orders', params.id);
    if (!order || order.customerId !== user.id) return fail(404);
    if (order.status !== ORDER_STATUS.PAID)
      return fail(409, {
        code: 'CANNOT_CANCEL',
        message:
          'The vendor has already accepted this order, so it can’t be cancelled here. Contact support for help.',
      });
    const body = await readJson(request);
    const now = new Date().toISOString();
    order.status = ORDER_STATUS.CANCELLED;
    order.cancelReason =
      String(body.reason ?? '')
        .trim()
        .slice(0, 200) || 'Cancelled by customer';
    order.statusHistory.push({ status: ORDER_STATUS.CANCELLED, at: now, by: 'customer' });
    order.updatedAt = now;
    const payment = db.payments.find((p) => p.orderId === order.id);
    if (payment) {
      payment.status = 'refunded';
      payment.refundedAt = now;
    }
    const vendor = findById('vendors', order.vendorId);
    notify(vendor?.ownerId, {
      type: 'order',
      title: 'Order cancelled',
      body: `The customer cancelled order KJT-${order.code}.`,
      link: `/vendor/orders/${order.id}`,
    });
    notify(user.id, {
      type: 'order',
      title: 'Order cancelled',
      body: `Order KJT-${order.code} was cancelled. You'll get a full refund.`,
      link: `/account/orders/${order.id}`,
    });
    persist();
    return ok(serializeOrder(order, user, { detail: true }));
  }),
];
