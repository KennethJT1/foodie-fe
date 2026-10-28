import { http, HttpResponse } from 'msw';

import { ACTIVE_ORDER_STATUSES, ORDER_STATUS } from '@/constants/order-status';
import { PERMISSIONS as P } from '@/constants/permissions';

import { db, findById, persist } from '../db';
import { liveMapSnapshot, riderSummary, updateOrderStatus } from '../realtime';
import { newId } from '../seed/seed';
import { audit, notify, requireUser } from '../utils/auth';
import { distanceMetres } from '../utils/geo';
import { applyListQuery, listResponse } from '../utils/list';
import { serializeOrder } from '../utils/orders';
import { api } from '../utils/path';
import { fail, latency, ok, readJson, validationError } from '../utils/respond';
import { vendorSubscription } from '../utils/subscriptions';

const DAY = 24 * 60 * 60 * 1000;
const S = ORDER_STATUS;
const lagosDay = (iso) => new Date(new Date(iso).getTime() + 3600000).toISOString().slice(0, 10);
const counted = (o) => ![S.CANCELLED, S.REJECTED].includes(o.status);

const admin = (request, permission) => requireUser(request, { roles: ['admin'], permission });

const reasonOr422 = async (request) => {
  const reason = String((await readJson(request)).reason ?? '').trim();
  return reason
    ? { reason: reason.slice(0, 500) }
    : { error: validationError({ reason: 'Give a reason' }) };
};

// ── Vendors ──────────────────────────────────────────────────────────────────
function vendorRow(v) {
  const owner = findById('users', v.ownerId);
  const plan = findById('plans', v.planId);
  return {
    id: v.id,
    name: v.name || 'Unnamed store',
    slug: v.slug,
    logo: v.logo,
    type: v.type,
    city: v.city,
    ownerName: owner?.name ?? '',
    ownerPhone: owner?.phone ?? '',
    approvalStatus: v.approvalStatus,
    subscriptionStatus: v.subscriptionStatus,
    planName: plan?.name ?? null,
    rating: v.rating,
    ratingCount: v.ratingCount,
    refundRate: v.refundRate,
    submittedAt: v.submittedAt ?? null,
    createdAt: v.createdAt,
  };
}

function vendorDetail(v) {
  const orders = db.orders.filter((o) => o.vendorId === v.id && counted(o));
  const monthAgo = new Date(Date.now() - 30 * DAY).toISOString();
  const recent = orders.filter((o) => o.createdAt >= monthAgo);
  return {
    ...vendorRow(v),
    description: v.description,
    phone: v.phone,
    email: v.email,
    address: v.address,
    lat: v.lat,
    lng: v.lng,
    deliveryRadiusKm: v.deliveryRadiusKm,
    prepTimeMins: v.prepTimeMins,
    isPaused: v.isPaused,
    rejectionReason: v.rejectionReason,
    suspensionReason: v.suspensionReason ?? null,
    approvedAt: v.approvedAt ?? null,
    documents: v.documents,
    bank: v.bank,
    bankChangeRequest: v.bankChangeRequest,
    subscription: vendorSubscription(v),
    followersCount: v.followersCount,
    itemCount: db.foodItems.filter((f) => f.vendorId === v.id && !f.deletedAt).length,
    stats: {
      orders30d: recent.length,
      gmv30d: recent.reduce((s, o) => s + o.subtotal, 0),
      openRefunds: db.refunds.filter(
        (r) => r.vendorId === v.id && ['requested', 'disputed', 'escalated'].includes(r.status),
      ).length,
    },
  };
}

// ── Riders ───────────────────────────────────────────────────────────────────
const hasActiveDelivery = (riderId) =>
  db.orders.some(
    (o) => o.riderId === riderId && [S.RIDER_ASSIGNED, S.PICKED_UP].includes(o.status),
  );

function riderRow(r) {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    city: r.city,
    vehicleType: r.vehicleType,
    plateNumber: r.plateNumber,
    approvalStatus: r.approvalStatus,
    isOnline: r.isOnline,
    isBusy: hasActiveDelivery(r.id),
    rating: r.rating,
    ratingCount: r.ratingCount,
    tripsCount: r.tripsCount,
    lastSeenAt: r.lastSeenAt ?? null,
    submittedAt: r.submittedAt ?? null,
    createdAt: r.createdAt,
    lat: r.lat,
    lng: r.lng,
  };
}

const riderDetail = (r) => ({
  ...riderRow(r),
  licenceNumber: r.licenceNumber,
  guarantor: r.guarantor,
  documents: r.documents,
  bank: r.bank,
  rejectionReason: r.rejectionReason,
  suspensionReason: r.suspensionReason ?? null,
  recentTrips: db.deliveries
    .filter((d) => d.riderId === r.id && d.status === 'delivered')
    .sort((a, b) => (b.deliveredAt ?? '').localeCompare(a.deliveredAt ?? ''))
    .slice(0, 5)
    .map((d) => ({
      id: d.id,
      orderId: d.orderId,
      orderCode: findById('orders', d.orderId)?.code ?? '',
      deliveredAt: d.deliveredAt,
      fee: d.fee,
    })),
});

/** Approve / reject / suspend / reinstate for vendors and riders, with notify + audit. */
function decisionHandlers({ path, collection, permission, label, owner, link, serialize }) {
  const load = (request, id) => {
    const { user, error } = admin(request, permission);
    if (error) return { error };
    const row = findById(collection, id);
    if (!row) return { error: fail(404) };
    return { user, row };
  };
  const decide = (action, apply) =>
    http.post(api(`${path}/:id/${action}`), async ({ request, params }) => {
      await latency();
      const { user, row, error } = load(request, params.id);
      if (error) return error;
      const result = await apply(row, request);
      if (result?.error) return result.error;
      audit(user, `${label}.${action}`, label, row.id, result.summary);
      notify(owner(row), { type: label, ...result.message, link });
      persist();
      return ok(serialize(row));
    });
  return [
    decide('approve', (row) => {
      if (row.approvalStatus !== 'pending')
        return { error: fail(409, { message: 'Only pending applications can be approved.' }) };
      Object.assign(row, {
        approvalStatus: 'approved',
        approvedAt: new Date().toISOString(),
        rejectionReason: null,
      });
      return {
        summary: `Approved ${row.name}`,
        message:
          label === 'vendor'
            ? {
                title: 'Your store is approved',
                body: 'Pick a plan and start your free trial to go live.',
              }
            : { title: "You're approved", body: 'Go online to start getting delivery jobs.' },
      };
    }),
    decide('reject', async (row, request) => {
      if (row.approvalStatus !== 'pending')
        return { error: fail(409, { message: 'Only pending applications can be rejected.' }) };
      const { reason, error } = await reasonOr422(request);
      if (error) return { error };
      Object.assign(row, { approvalStatus: 'rejected', rejectionReason: reason });
      return {
        summary: `Rejected ${row.name}: ${reason}`,
        message: { title: "We couldn't approve your application yet", body: reason },
      };
    }),
    decide('suspend', async (row, request) => {
      if (row.approvalStatus !== 'approved')
        return { error: fail(409, { message: 'Only approved accounts can be suspended.' }) };
      const { reason, error } = await reasonOr422(request);
      if (error) return { error };
      Object.assign(row, { approvalStatus: 'suspended', suspensionReason: reason });
      if (label === 'rider') row.isOnline = false;
      return {
        summary: `Suspended ${row.name}: ${reason}`,
        message: { title: 'Your account is suspended', body: reason },
      };
    }),
    decide('reinstate', (row) => {
      if (row.approvalStatus !== 'suspended')
        return { error: fail(409, { message: 'This account is not suspended.' }) };
      Object.assign(row, { approvalStatus: 'approved', suspensionReason: null });
      return {
        summary: `Reinstated ${row.name}`,
        message: { title: 'Your account is active again', body: 'Welcome back.' },
      };
    }),
  ];
}

export const adminHandlers = [
  // ── Overview (BRD section 8, admin dashboard) ────────────────────────────
  http.get(api('/admin/overview'), async ({ request }) => {
    await latency();
    const { error } = admin(request, P.DASHBOARD_VIEW);
    if (error) return error;
    const days = Math.min(90, Number(new URL(request.url).searchParams.get('days')) || 14);
    const today = lagosDay(new Date().toISOString());
    const yesterday = lagosDay(new Date(Date.now() - DAY).toISOString());
    const onDay = (day) => db.orders.filter((o) => counted(o) && lagosDay(o.createdAt) === day);
    const gmv = (list) => list.reduce((s, o) => s + o.total, 0);
    const month = new Date().toISOString().slice(0, 7);
    const monthOrders = db.orders.filter((o) => counted(o) && o.createdAt.startsWith(month));
    const activeSubs = db.vendors.filter((v) => ['active', 'grace'].includes(v.subscriptionStatus));
    const mrr = activeSubs.reduce((s, v) => {
      const sub = vendorSubscription(v);
      const plan = findById('plans', sub?.planId ?? v.planId);
      if (!plan) return s;
      return (
        s +
        (sub?.interval === 'yearly'
          ? Math.round((plan.monthlyPrice * 12 * (1 - db.settings.yearlyDiscountPct / 100)) / 12)
          : plan.monthlyPrice)
      );
    }, 0);
    const signupsSince = new Date(Date.now() - 7 * DAY).toISOString();
    const signups = (role) =>
      db.users.filter((u) => u.role === role && u.createdAt >= signupsSince).length;
    const t = onDay(today);
    const y = onDay(yesterday);
    const change = (a, b) => (b ? ((a - b) / b) * 100 : null);
    return ok({
      gmvToday: gmv(t),
      gmvChange: change(gmv(t), gmv(y)),
      ordersToday: t.length,
      ordersChange: change(t.length, y.length),
      activeDeliveries: db.orders.filter((o) => [S.RIDER_ASSIGNED, S.PICKED_UP].includes(o.status))
        .length,
      activeOrders: db.orders.filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status)).length,
      mrr,
      payingVendors: activeSubs.length,
      deliveryFeeRevenue: monthOrders
        .filter((o) => o.status === S.DELIVERED)
        .reduce((s, o) => s + o.deliveryFee, 0),
      signups: {
        customers: signups('customer'),
        vendors: signups('vendor'),
        riders: signups('rider'),
      },
      onlineRiders: db.riders.filter((r) => r.isOnline).length,
      pending: {
        vendors: db.vendors.filter((v) => v.approvalStatus === 'pending').length,
        riders: db.riders.filter((r) => r.approvalStatus === 'pending').length,
        refunds: db.refunds.filter((r) => ['disputed', 'escalated'].includes(r.status)).length,
      },
      series: Array.from({ length: days }, (_, i) => {
        const day = lagosDay(new Date(Date.now() - (days - 1 - i) * DAY).toISOString());
        const list = onDay(day);
        return { date: day, orders: list.length, gmv: gmv(list) };
      }),
    });
  }),

  // ── Vendors ───────────────────────────────────────────────────────────────
  http.get(api('/admin/vendors'), async ({ request }) => {
    await latency();
    const { error } = admin(request, P.VENDORS_VIEW);
    if (error) return error;
    return listResponse(
      applyListQuery(
        db.vendors.filter((v) => v.approvalStatus !== 'draft').map(vendorRow),
        new URL(request.url).searchParams,
        {
          searchFields: ['name', 'ownerName', 'ownerPhone', 'city'],
          filters: {
            approvalStatus: 'approvalStatus',
            subscriptionStatus: 'subscriptionStatus',
            type: 'type',
            city: 'city',
          },
        },
      ),
    );
  }),

  http.get(api('/admin/vendors/:id'), async ({ request, params }) => {
    await latency();
    const { error } = admin(request, P.VENDORS_VIEW);
    if (error) return error;
    const v = findById('vendors', params.id);
    if (!v) return fail(404, { message: "We couldn't find that vendor." });
    return ok(vendorDetail(v));
  }),

  ...decisionHandlers({
    path: '/admin/vendors',
    collection: 'vendors',
    permission: P.VENDORS_APPROVE,
    label: 'vendor',
    owner: (v) => v.ownerId,
    link: '/vendor/status',
    serialize: vendorDetail,
  }),

  // BR-PAY-02: an admin approves a new settlement account
  http.post(api('/admin/vendors/:id/bank-change/:decision'), async ({ request, params }) => {
    await latency();
    const { user, error } = admin(request, P.VENDORS_APPROVE);
    if (error) return error;
    const v = findById('vendors', params.id);
    const change = v?.bankChangeRequest;
    if (!change || change.status !== 'pending')
      return fail(404, { message: 'There is no bank change to review.' });
    if (params.decision === 'approve') {
      v.bank = {
        bankCode: change.bankCode,
        bankName: change.bankName,
        accountNumber: change.accountNumber,
        accountName: change.accountName,
        verified: true,
      };
      change.status = 'approved';
    } else if (params.decision === 'reject') change.status = 'rejected';
    else return fail(400);
    change.decidedAt = new Date().toISOString();
    audit(
      user,
      `vendor.bank_change_${change.status}`,
      'vendor',
      v.id,
      `${change.status} bank change for ${v.name}`,
    );
    notify(v.ownerId, {
      type: 'vendor',
      title:
        change.status === 'approved'
          ? 'Your new bank account is approved'
          : 'Your bank change was not approved',
      body: `${change.bankName} · ${change.accountName}`,
      link: '/vendor/settings',
    });
    persist();
    return ok(vendorDetail(v));
  }),

  // ── Riders ────────────────────────────────────────────────────────────────
  http.get(api('/admin/riders'), async ({ request }) => {
    await latency();
    const { error } = admin(request, P.RIDERS_VIEW);
    if (error) return error;
    const params = new URL(request.url).searchParams;
    let rows = db.riders.filter((r) => r.approvalStatus !== 'draft').map(riderRow);
    // ?nearOrderId= sorts free online riders by distance to that order's vendor (reassignment)
    const near = params.get('nearOrderId') && findById('orders', params.get('nearOrderId'));
    if (near) {
      const vendor = findById('vendors', near.vendorId);
      rows = rows
        .filter(
          (r) =>
            r.approvalStatus === 'approved' && r.isOnline && !r.isBusy && r.id !== near.riderId,
        )
        .map((r) => ({ ...r, distanceM: r.lat == null ? null : distanceMetres(r, vendor) }))
        .sort((a, b) => (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity));
    }
    return listResponse(
      applyListQuery(rows, params, {
        searchFields: ['name', 'phone', 'plateNumber', 'city'],
        filters: {
          approvalStatus: 'approvalStatus',
          vehicleType: 'vehicleType',
          city: 'city',
          online: (r, [v]) => String(r.isOnline) === v,
        },
        defaultSort: near ? '' : '-createdAt',
      }),
    );
  }),

  http.get(api('/admin/riders/:id'), async ({ request, params }) => {
    await latency();
    const { error } = admin(request, P.RIDERS_VIEW);
    if (error) return error;
    const r = findById('riders', params.id);
    if (!r) return fail(404, { message: "We couldn't find that rider." });
    return ok(riderDetail(r));
  }),

  ...decisionHandlers({
    path: '/admin/riders',
    collection: 'riders',
    permission: P.RIDERS_APPROVE,
    label: 'rider',
    owner: (r) => r.userId,
    link: '/rider/status',
    serialize: riderDetail,
  }),

  // ── Customers ─────────────────────────────────────────────────────────────
  http.get(api('/admin/customers'), async ({ request }) => {
    await latency();
    const { error } = admin(request, P.CUSTOMERS_VIEW);
    if (error) return error;
    const orderCount = new Map();
    for (const o of db.orders)
      orderCount.set(o.customerId, (orderCount.get(o.customerId) ?? 0) + 1);
    const rows = db.users
      .filter((u) => u.role === 'customer')
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        status: u.status,
        ordersCount: orderCount.get(u.id) ?? 0,
        createdAt: u.createdAt,
      }));
    return listResponse(
      applyListQuery(rows, new URL(request.url).searchParams, {
        searchFields: ['name', 'email', 'phone'],
        filters: { status: 'status' },
      }),
    );
  }),

  http.post(api('/admin/customers/:id/status'), async ({ request, params }) => {
    await latency();
    const { user, error } = admin(request, P.CUSTOMERS_BAN);
    if (error) return error;
    const customer = findById('users', params.id);
    if (!customer || customer.role !== 'customer') return fail(404);
    const body = await readJson(request);
    if (!['active', 'suspended', 'banned'].includes(body.status))
      return validationError({ status: 'Pick a status' });
    const reason = String(body.reason ?? '').trim();
    if (body.status !== 'active' && !reason) return validationError({ reason: 'Give a reason' });
    customer.status = body.status;
    customer.statusReason = reason || null;
    audit(
      user,
      `customer.${body.status}`,
      'user',
      customer.id,
      `${customer.name} set to ${body.status}${reason ? `: ${reason}` : ''}`,
    );
    persist();
    return ok({ id: customer.id, status: customer.status });
  }),

  // ── Orders: manual rider reassignment (Dispatch) ──────────────────────────
  http.post(api('/admin/orders/:id/reassign'), async ({ request, params }) => {
    await latency();
    const { user, error } = admin(request, P.ORDERS_REASSIGN);
    if (error) return error;
    const order = findById('orders', params.id);
    if (!order) return fail(404);
    if (![S.READY_FOR_PICKUP, S.RIDER_ASSIGNED].includes(order.status))
      return fail(409, { message: 'You can only reassign an order before the rider picks it up.' });
    const rider = findById('riders', (await readJson(request)).riderId);
    if (!rider || rider.approvalStatus !== 'approved')
      return validationError({ riderId: 'Pick an approved rider' });
    if (rider.id === order.riderId)
      return validationError({ riderId: 'This rider already has the order' });
    if (hasActiveDelivery(rider.id))
      return validationError({ riderId: 'This rider is on another delivery' });

    const previous = order.riderId && findById('riders', order.riderId);
    const vendor = findById('vendors', order.vendorId);
    let delivery = db.deliveries.find((d) => d.orderId === order.id);
    if (!delivery) {
      delivery = {
        id: newId('del'),
        orderId: order.id,
        status: 'assigned',
        fee: order.deliveryFee,
        riderEarning: 0,
        payoutPct: db.settings.riderPayoutPct,
        distanceM: order.distanceM,
        pickup: {
          lat: vendor.lat,
          lng: vendor.lng,
          name: vendor.name,
          address: vendor.address?.line1,
        },
        dropoff: {
          lat: order.address.lat,
          lng: order.address.lng,
          name: order.customerName,
          address: order.address.line1,
        },
        pickedUpAt: null,
        deliveredAt: null,
        route: [],
      };
      db.deliveries.push(delivery);
    }
    Object.assign(delivery, { riderId: rider.id, assignedAt: new Date().toISOString(), route: [] });
    order.riderId = rider.id;
    if (order.status === S.RIDER_ASSIGNED) {
      order.statusHistory.push({
        status: S.RIDER_ASSIGNED,
        at: new Date().toISOString(),
        by: 'admin',
        note: `Reassigned to ${rider.name}`,
      });
      order.updatedAt = new Date().toISOString();
    } else updateOrderStatus(order, S.RIDER_ASSIGNED, { rider: riderSummary(rider) }, 'admin');
    if (previous)
      notify(previous.userId, {
        type: 'delivery',
        title: 'Delivery reassigned',
        body: `Order KJT-${order.code} went to another rider.`,
        link: '/rider',
      });
    notify(rider.userId, {
      type: 'delivery',
      title: 'New delivery for you',
      body: `Pick up order KJT-${order.code} from ${vendor.name}.`,
      link: '/rider/delivery',
    });
    audit(
      user,
      'order.reassign',
      'order',
      order.id,
      `KJT-${order.code}: ${previous?.name ?? 'no rider'} → ${rider.name}`,
    );
    persist();
    return ok(serializeOrder(order, user, { detail: true }));
  }),

  // ── Live map (FR-GPS-04) ──────────────────────────────────────────────────
  http.get(api('/admin/live-map'), async ({ request }) => {
    await latency();
    const { error } = admin(request, P.LIVE_MAP_VIEW);
    if (error) return error;
    return HttpResponse.json({ success: true, data: liveMapSnapshot() });
  }),
];
