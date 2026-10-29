import { http } from 'msw';

import { db, persist } from '../db';
import { requireUser } from '../utils/auth';
import { listResponse, applyListQuery } from '../utils/list';
import { createOrderFromPayment, priceCart, serializeOrder } from '../utils/orders';
import { api } from '../utils/path';
import { fail, latency, ok, readJson } from '../utils/respond';

const randomRef = () =>
  `KJT_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`.toUpperCase();

const quoteFailure = ({ status, message, code, fieldErrors }) =>
  fail(status, { message, code, fieldErrors });

/** Payments waiting for the gateway; an order exists only after verify (FR-ORD-03). */
const pendingPayments = () => (db.pendingPayments ??= []);

export const checkoutHandlers = [
  http.post(api('/checkout/quote'), async ({ request }) => {
    await latency();
    const { user, error } = requireUser(request, { roles: ['customer'] });
    if (error) return error;
    const { quote, error: problem } = priceCart(user, await readJson(request));
    if (problem) return quoteFailure(problem);
    return ok(quote);
  }),

  http.post(api('/payments/initialize'), async ({ request }) => {
    await latency();
    const { user, error } = requireUser(request, { roles: ['customer'] });
    if (error) return error;
    const body = await readJson(request);
    const { quote, error: problem } = priceCart(user, body);
    if (problem) return quoteFailure(problem);
    const deliveryNote = String(body.deliveryNote ?? '')
      .trim()
      .slice(0, 200);
    const pending = {
      reference: randomRef(),
      accessCode: Math.random().toString(36).slice(2, 14),
      userId: user.id,
      quote,
      deliveryNote,
      status: 'pending',
      orderId: null,
      createdAt: new Date().toISOString(),
    };
    pendingPayments().push(pending);
    persist();
    return ok({
      reference: pending.reference,
      accessCode: pending.accessCode,
      amount: quote.total,
      email: user.email ?? `${user.id}@customers.kjtfoodie.test`,
    });
  }),

  // Called after the Paystack popup reports success. Idempotent: a second call returns the order.
  http.post(api('/payments/verify'), async ({ request }) => {
    await latency();
    const { user, error } = requireUser(request, { roles: ['customer'] });
    if (error) return error;
    const { reference } = await readJson(request);
    const pending = pendingPayments().find(
      (p) => p.reference === reference && p.userId === user.id,
    );
    if (!pending) return fail(404, { message: "We couldn't find that payment." });
    if (pending.status !== 'success') {
      const order = createOrderFromPayment(user, pending);
      pending.status = 'success';
      pending.orderId = order.id;
      persist();
    }
    const order = db.orders.find((o) => o.id === pending.orderId);
    return ok({ status: 'success', reference, order: serializeOrder(order, user) });
  }),

  http.get(api('/me/payments'), async ({ request }) => {
    await latency();
    const { user, error } = requireUser(request, { roles: ['customer'] });
    if (error) return error;
    const params = new URL(request.url).searchParams;
    const orders = new Map(db.orders.map((o) => [o.id, o]));
    const rows = db.payments
      .filter((p) => p.type === 'order' && p.customerId === user.id)
      .map((p) => {
        const o = orders.get(p.orderId);
        return {
          id: p.id,
          reference: p.reference,
          amount: p.amount,
          channel: p.channel,
          status: o?.status === 'cancelled' || o?.status === 'rejected' ? 'refunded' : p.status,
          orderId: p.orderId,
          orderCode: o?.code ?? null,
          vendorName: o?.vendorName ?? null,
          createdAt: p.createdAt,
        };
      });
    return listResponse(
      applyListQuery(rows, params, {
        searchFields: ['reference', 'orderCode', 'vendorName'],
        filters: { status: 'status', channel: 'channel' },
      }),
    );
  }),
];
