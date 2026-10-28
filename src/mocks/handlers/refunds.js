import { http } from 'msw';

import { PERMISSIONS } from '@/constants/permissions';

import { db, findById, persist } from '../db';
import { newId } from '../seed/seed';
import { notify, permissionsFor, requireUser } from '../utils/auth';
import { applyListQuery, listResponse } from '../utils/list';
import { api } from '../utils/path';
import { created, fail, latency, ok, readJson, validationError } from '../utils/respond';

/** Refunds a user may see: own (customer), own store (vendor), all (admin with refunds.view). */
export function canSeeRefund(user, refund) {
  if (user.role === 'customer') return refund.customerId === user.id;
  if (user.role === 'vendor') return refund.vendorId === user.vendorId;
  if (user.role === 'admin') return permissionsFor(user).includes(PERMISSIONS.REFUNDS_VIEW);
  return false;
}

const step = (status, by, note = null) => ({ status, at: new Date().toISOString(), by, note });

function notifyAdmins(payload) {
  db.users
    .filter((u) => u.role === 'admin' && permissionsFor(u).includes(PERMISSIONS.REFUNDS_VIEW))
    .forEach((u) => notify(u.id, payload));
}

function ownRefund(request, id) {
  const { user, error } = requireUser(request, { roles: ['customer'] });
  if (error) return { error };
  const refund = findById('refunds', id);
  if (!refund || refund.customerId !== user.id) return { error: fail(404) };
  return { user, refund };
}

export const refundHandlers = [
  http.get(api('/refunds'), async ({ request }) => {
    await latency();
    const { user, error } = requireUser(request);
    if (error) return error;
    const params = new URL(request.url).searchParams;
    const rows = db.refunds.filter((r) => canSeeRefund(user, r));
    return listResponse(
      applyListQuery(rows, params, {
        searchFields: ['orderCode', 'vendorName', 'customerName', 'reason'],
        filters: { status: 'status', vendorId: 'vendorId', orderId: 'orderId' },
      }),
    );
  }),

  http.get(api('/refunds/:id'), async ({ request, params }) => {
    await latency();
    const { user, error } = requireUser(request);
    if (error) return error;
    const refund = findById('refunds', params.id);
    if (!refund || !canSeeRefund(user, refund)) return fail(404);
    return ok(refund);
  }),

  // BR-REF-02: the customer raises a refund on a delivered order
  http.post(api('/refunds'), async ({ request }) => {
    await latency();
    const { user, error } = requireUser(request, { roles: ['customer'] });
    if (error) return error;
    const body = await readJson(request);
    const order = findById('orders', body.orderId);
    if (!order || order.customerId !== user.id) return fail(404);
    if (order.status !== 'delivered')
      return fail(409, { message: 'You can ask for a refund once the order is delivered.' });
    if (db.refunds.some((r) => r.orderId === order.id))
      return fail(409, { message: 'There is already a refund request for this order.' });
    const errors = {};
    const reason = String(body.reason ?? '').trim();
    const amount = Math.round(Number(body.amount));
    if (!reason) errors.reason = 'Pick a reason';
    if (!(amount > 0)) errors.amount = 'Enter the amount you want back';
    else if (amount > order.subtotal) errors.amount = 'You can ask for up to the food subtotal';
    const details = String(body.details ?? '').trim();
    if (details.length > 500) errors.details = 'Keep it under 500 characters';
    const photos = Array.isArray(body.photos) ? body.photos.slice(0, 3) : [];
    if (Object.keys(errors).length) return validationError(errors);

    const now = new Date();
    const refund = {
      id: newId('rfd'),
      orderId: order.id,
      orderCode: order.code,
      customerId: user.id,
      customerName: user.name,
      vendorId: order.vendorId,
      vendorName: order.vendorName,
      reason,
      details,
      amount,
      orderSubtotal: order.subtotal,
      photos,
      status: 'requested',
      deadline: new Date(now.getTime() + db.settings.refundDeadlineHours * 3600000).toISOString(),
      vendorResponse: null,
      paymentReference: null,
      escalated: false,
      timeline: [step('requested', 'customer', details || null)],
      comments: [],
      createdAt: now.toISOString(),
    };
    db.refunds.unshift(refund);
    const vendor = findById('vendors', order.vendorId);
    notify(vendor?.ownerId, {
      type: 'refund',
      title: 'New refund request',
      body: `Order KJT-${order.code}: ${reason}. Respond within ${db.settings.refundDeadlineHours} h.`,
      link: '/vendor/refunds',
    });
    persist();
    return created(refund);
  }),

  // BR-REF-04: the customer confirms receipt…
  http.post(api('/refunds/:id/confirm'), async ({ request, params }) => {
    await latency();
    const { refund, error } = ownRefund(request, params.id);
    if (error) return error;
    if (refund.status !== 'paid')
      return fail(409, { message: 'You can confirm once the vendor marks the refund as paid.' });
    refund.status = 'confirmed';
    refund.timeline.push(step('confirmed', 'customer'));
    persist();
    return ok(refund);
  }),

  // …or disputes it (also after a rejection); admins are told
  http.post(api('/refunds/:id/dispute'), async ({ request, params }) => {
    await latency();
    const { refund, error } = ownRefund(request, params.id);
    if (error) return error;
    if (!['paid', 'rejected'].includes(refund.status))
      return fail(409, { message: 'You can dispute after the vendor responds.' });
    const { reason } = await readJson(request);
    const note = String(reason ?? '').trim();
    if (!note) return validationError({ reason: 'Tell us what went wrong' });
    refund.status = 'disputed';
    refund.timeline.push(step('disputed', 'customer', note.slice(0, 500)));
    notifyAdmins({
      type: 'refund',
      title: 'Refund disputed',
      body: `Order KJT-${refund.orderCode}: ${note.slice(0, 80)}`,
      link: `/admin/refunds/${refund.id}`,
    });
    persist();
    return ok(refund);
  }),
];
