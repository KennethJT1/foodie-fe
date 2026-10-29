import { http } from 'msw';

import { ORDER_STATUS } from '@/constants/order-status';
import { PERMISSIONS } from '@/constants/permissions';
import { normalisePhone } from '@/lib/format';

import { db, findById, persist } from '../db';
import {
  cancelJobOffers,
  publicDelivery,
  riderSummary,
  scheduleJobOffer,
  updateOrderStatus,
} from '../realtime';
import { resolveAccount } from './onboarding';
import { newId } from '../seed/seed';
import { notify, permissionsFor, requireUser } from '../utils/auth';
import { applyListQuery, listResponse } from '../utils/list';
import { api } from '../utils/path';
import { created, fail, latency, noContent, ok, readJson, validationError } from '../utils/respond';

const S = ORDER_STATUS;
const STEPS = ['vehicle', 'guarantor', 'documents', 'bank', 'review'];
const EDITABLE = ['draft', 'rejected'];
const VEHICLES = ['motorcycle', 'bicycle', 'car'];

function ownRider(request, { approved = false, editable = false } = {}) {
  const { user, error } = requireUser(request, { roles: ['rider'] });
  if (error) return { error };
  const rider = findById('riders', user.riderId);
  if (!rider) return { error: fail(404) };
  if (approved && rider.approvalStatus !== 'approved')
    return {
      error: fail(409, { code: 'NOT_APPROVED', message: 'Your account is not approved yet.' }),
    };
  if (editable && !EDITABLE.includes(rider.approvalStatus))
    return {
      error: fail(409, {
        code: 'ALREADY_SUBMITTED',
        message: 'Your details are with our team. Contact support to change them.',
      }),
    };
  return { user, rider };
}

const requiredDocs = () => db.requiredDocuments.rider ?? [];
const missingDocs = (rider) =>
  requiredDocs().filter((d) => !rider.documents.some((x) => x.type === d.type));

const serializeProfile = (r) => ({
  id: r.id,
  name: r.name,
  phone: r.phone,
  approvalStatus: r.approvalStatus,
  rejectionReason: r.rejectionReason,
  isOnline: r.isOnline,
  vehicleType: r.vehicleType,
  plateNumber: r.plateNumber,
  rating: r.rating,
  ratingCount: r.ratingCount,
  tripsCount: r.tripsCount,
  city: r.city,
  lat: r.lat,
  lng: r.lng,
  payoutPct: db.settings.riderPayoutPct,
  bank: r.bank && {
    bankName: r.bank.bankName,
    accountName: r.bank.accountName,
    accountNumberLast4: r.bank.accountNumber.slice(-4),
  },
});

const serializeOnboarding = (r) => ({
  step: r.onboardingStep ?? (r.approvalStatus === 'draft' ? 'vehicle' : 'submitted'),
  approvalStatus: r.approvalStatus,
  rejectionReason: r.rejectionReason,
  submittedAt: r.submittedAt ?? null,
  vehicleType: r.vehicleType,
  plateNumber: r.plateNumber,
  licenceNumber: r.licenceNumber,
  guarantor: r.guarantor,
  documents: r.documents,
  requiredDocuments: requiredDocs(),
  bank: r.bank,
});

function applyStep(user, rider, step, body) {
  const errors = {};
  if (step === 'vehicle') {
    if (!VEHICLES.includes(body.vehicleType)) errors.vehicleType = 'Pick your vehicle';
    const plate = String(body.plateNumber ?? '')
      .trim()
      .toUpperCase();
    if (body.vehicleType !== 'bicycle' && plate.length < 5)
      errors.plateNumber = 'Enter the plate number';
    const licence = String(body.licenceNumber ?? '')
      .trim()
      .toUpperCase();
    if (licence.length < 6) errors.licenceNumber = "Enter your driver's or rider's licence number";
    if (!Object.keys(errors).length)
      Object.assign(rider, {
        vehicleType: body.vehicleType,
        plateNumber: plate,
        licenceNumber: licence,
      });
  }
  if (step === 'guarantor') {
    const g = body.guarantor ?? {};
    const name = String(g.name ?? '').trim();
    const phone = normalisePhone(g.phone ?? '');
    if (name.length < 3) errors['guarantor.name'] = "Enter your guarantor's full name";
    if (!phone) errors['guarantor.phone'] = 'Enter a valid Nigerian phone number';
    if (!String(g.relationship ?? '').trim())
      errors['guarantor.relationship'] = 'How do you know them?';
    if (String(g.address ?? '').trim().length < 5)
      errors['guarantor.address'] = 'Enter their home address';
    if (phone && phone === rider.phone)
      errors['guarantor.phone'] = "Your guarantor can't use your own number";
    if (!Object.keys(errors).length)
      rider.guarantor = {
        name,
        phone,
        relationship: g.relationship.trim(),
        address: g.address.trim(),
      };
  }
  if (step === 'documents')
    for (const d of missingDocs(rider)) errors[d.type] = `Upload your ${d.label.toLowerCase()}`;
  if (step === 'bank') {
    const { account, fieldErrors } = resolveAccount(user, body);
    if (fieldErrors) Object.assign(errors, fieldErrors);
    else rider.bank = { ...account, verified: true };
  }
  return Object.keys(errors).length ? errors : null;
}

/** The rider's current job, with what they need on the road. */
function activeDelivery(rider) {
  const order = db.orders.find(
    (o) => o.riderId === rider.id && [S.RIDER_ASSIGNED, S.PICKED_UP].includes(o.status),
  );
  if (!order) return null;
  const delivery = db.deliveries.find((d) => d.orderId === order.id);
  const vendor = findById('vendors', order.vendorId);
  return {
    id: delivery.id,
    orderId: order.id,
    orderCode: order.code,
    status: order.status,
    fee: order.deliveryFee,
    earning: Math.round((order.deliveryFee * delivery.payoutPct) / 100),
    distanceM: order.distanceM,
    itemCount: order.items.reduce((n, l) => n + l.quantity, 0),
    pickup: {
      name: vendor.name,
      phone: vendor.phone,
      address: [vendor.address?.line1, vendor.address?.area].filter(Boolean).join(', '),
      lat: vendor.lat,
      lng: vendor.lng,
    },
    dropoff: {
      name: order.customerName,
      phone: order.customerPhone,
      address: [order.address.line1, order.address.area].filter(Boolean).join(', '),
      note: order.deliveryNote,
      lat: order.address.lat,
      lng: order.address.lng,
    },
    rider: { lat: rider.lat, lng: rider.lng },
    assignedAt: delivery.assignedAt,
    pickedUpAt: delivery.pickedUpAt,
  };
}

/** Marks old pending offers expired. */
function expireOffers(riderId) {
  const now = new Date().toISOString();
  for (const o of db.jobOffers ?? [])
    if (o.riderId === riderId && o.status === 'pending' && o.expiresAt <= now) o.status = 'expired';
}

function ownDelivery(request, id) {
  const { rider, error } = ownRider(request, { approved: true });
  if (error) return { error };
  const delivery = findById('deliveries', id);
  if (!delivery || delivery.riderId !== rider.id) return { error: fail(404) };
  return { rider, delivery, order: findById('orders', delivery.orderId) };
}

const monthOf = (iso) => iso.slice(0, 7);

export const riderHandlers = [
  // ── Onboarding (vehicle, licence, guarantor, documents, bank) ──────────────
  http.get(api('/rider/onboarding'), async ({ request }) => {
    await latency();
    const { rider, error } = ownRider(request);
    if (error) return error;
    return ok(serializeOnboarding(rider));
  }),

  http.patch(api('/rider/onboarding'), async ({ request }) => {
    await latency();
    const { user, rider, error } = ownRider(request, { editable: true });
    if (error) return error;
    const body = await readJson(request);
    if (!STEPS.slice(0, -1).includes(body.step)) return fail(400);
    const errors = applyStep(user, rider, body.step, body);
    if (errors) return validationError(errors);
    const next = STEPS[STEPS.indexOf(body.step) + 1];
    const reached = STEPS.indexOf(rider.onboardingStep ?? 'vehicle');
    if (rider.onboardingStep !== 'submitted' && STEPS.indexOf(next) > reached)
      rider.onboardingStep = next;
    persist();
    return ok(serializeOnboarding(rider));
  }),

  http.post(api('/rider/onboarding/submit'), async ({ request }) => {
    await latency();
    const { rider, error } = ownRider(request, { editable: true });
    if (error) return error;
    if (
      !rider.vehicleType ||
      !rider.guarantor ||
      !rider.bank?.verified ||
      missingDocs(rider).length
    )
      return fail(422, {
        message: 'Some steps are not finished yet. Check each step and try again.',
      });
    Object.assign(rider, {
      approvalStatus: 'pending',
      rejectionReason: null,
      submittedAt: new Date().toISOString(),
      onboardingStep: 'submitted',
    });
    db.users
      .filter((u) => u.role === 'admin' && permissionsFor(u).includes(PERMISSIONS.RIDERS_APPROVE))
      .forEach((u) =>
        notify(u.id, {
          type: 'rider_submitted',
          title: 'New rider to review',
          body: `${rider.name} sent their documents for approval.`,
          link: `/admin/riders/${rider.id}`,
        }),
      );
    persist();
    return ok(serializeOnboarding(rider));
  }),

  http.post(api('/rider/documents'), async ({ request }) => {
    await latency();
    const { rider, error } = ownRider(request, { editable: true });
    if (error) return error;
    const { type, url } = await readJson(request);
    const required = requiredDocs().find((d) => d.type === type);
    if (!required) return validationError({ type: 'Pick which document this is' });
    if (!url) return validationError({ url: 'Add a photo or scan of the document' });
    const doc = {
      id: newId('doc'),
      type,
      label: required.label,
      url,
      uploadedAt: new Date().toISOString(),
    };
    rider.documents = [...rider.documents.filter((d) => d.type !== type), doc];
    persist();
    return created(doc);
  }),

  http.delete(api('/rider/documents/:id'), async ({ request, params }) => {
    await latency();
    const { rider, error } = ownRider(request, { editable: true });
    if (error) return error;
    if (!rider.documents.some((d) => d.id === params.id)) return fail(404);
    rider.documents = rider.documents.filter((d) => d.id !== params.id);
    persist();
    return noContent();
  }),

  // ── Work ───────────────────────────────────────────────────────────────────
  http.get(api('/rider/me'), async ({ request }) => {
    await latency();
    const { rider, error } = ownRider(request);
    if (error) return error;
    return ok(serializeProfile(rider));
  }),

  // Going online starts job offers; the app then sends rider:location every 5–10 s
  http.post(api('/rider/status'), async ({ request }) => {
    await latency();
    const { rider, error } = ownRider(request, { approved: true });
    if (error) return error;
    const { isOnline, lat, lng } = await readJson(request);
    rider.isOnline = Boolean(isOnline);
    if (Number.isFinite(lat) && Number.isFinite(lng)) Object.assign(rider, { lat, lng });
    rider.lastSeenAt = new Date().toISOString();
    if (rider.isOnline) scheduleJobOffer(rider.id);
    else {
      cancelJobOffers(rider.id);
      for (const o of db.jobOffers ?? [])
        if (o.riderId === rider.id && o.status === 'pending') o.status = 'expired';
    }
    persist();
    return ok(serializeProfile(rider));
  }),

  http.get(api('/rider/offers'), async ({ request }) => {
    await latency();
    const { rider, error } = ownRider(request, { approved: true });
    if (error) return error;
    expireOffers(rider.id);
    return ok((db.jobOffers ?? []).filter((o) => o.riderId === rider.id && o.status === 'pending'));
  }),

  http.post(api('/deliveries/offers/:id/accept'), async ({ request, params }) => {
    await latency();
    const { rider, error } = ownRider(request, { approved: true });
    if (error) return error;
    expireOffers(rider.id);
    const offer = (db.jobOffers ?? []).find((o) => o.id === params.id && o.riderId === rider.id);
    if (!offer) return fail(404);
    if (offer.status !== 'pending')
      return fail(409, { code: 'OFFER_GONE', message: 'This job is no longer available.' });
    const order = findById('orders', offer.orderId);
    if (!order || order.status !== S.READY_FOR_PICKUP || order.riderId) {
      offer.status = 'expired';
      persist();
      return fail(409, { code: 'OFFER_GONE', message: 'Another rider took this job.' });
    }
    offer.status = 'accepted';
    order.riderId = rider.id;
    const vendor = findById('vendors', order.vendorId);
    const delivery = {
      id: newId('del'),
      orderId: order.id,
      riderId: rider.id,
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
      assignedAt: new Date().toISOString(),
      pickedUpAt: null,
      deliveredAt: null,
      route: [],
    };
    db.deliveries.push(delivery);
    updateOrderStatus(order, S.RIDER_ASSIGNED, {
      rider: riderSummary(rider),
      delivery: publicDelivery(delivery),
    });
    persist();
    return ok(activeDelivery(rider));
  }),

  http.post(api('/deliveries/offers/:id/decline'), async ({ request, params }) => {
    await latency();
    const { rider, error } = ownRider(request, { approved: true });
    if (error) return error;
    const offer = (db.jobOffers ?? []).find((o) => o.id === params.id && o.riderId === rider.id);
    if (!offer) return fail(404);
    if (offer.status === 'pending')
      offer.status = offer.expiresAt <= new Date().toISOString() ? 'expired' : 'declined';
    if (rider.isOnline) scheduleJobOffer(rider.id);
    persist();
    return ok(offer);
  }),

  http.get(api('/rider/delivery'), async ({ request }) => {
    await latency();
    const { rider, error } = ownRider(request, { approved: true });
    if (error) return error;
    return ok(activeDelivery(rider));
  }),

  http.post(api('/deliveries/:id/pickup'), async ({ request, params }) => {
    await latency();
    const { rider, delivery, order, error } = ownDelivery(request, params.id);
    if (error) return error;
    if (order.status !== S.RIDER_ASSIGNED)
      return fail(409, { message: 'This order has already been picked up.' });
    delivery.status = 'picked_up';
    delivery.pickedUpAt = new Date().toISOString();
    updateOrderStatus(order, S.PICKED_UP, { rider: riderSummary(rider) });
    persist();
    return ok(activeDelivery(rider));
  }),

  // FR-GPS: the customer's 4-digit code proves the food reached them
  http.post(api('/deliveries/:id/complete'), async ({ request, params }) => {
    await latency();
    const { rider, delivery, order, error } = ownDelivery(request, params.id);
    if (error) return error;
    if (order.status !== S.PICKED_UP)
      return fail(409, { message: 'Pick up the order before you complete it.' });
    const { code } = await readJson(request);
    if (String(code ?? '') !== order.deliveryCode)
      return validationError({
        code: "That code doesn't match. Ask the customer to check their app.",
      });
    const now = new Date().toISOString();
    Object.assign(delivery, {
      status: 'delivered',
      deliveredAt: now,
      riderEarning: Math.round((order.deliveryFee * delivery.payoutPct) / 100),
    });
    rider.tripsCount += 1;
    updateOrderStatus(order, S.DELIVERED, { rider: riderSummary(rider) });
    notify(order.customerId, {
      type: 'order',
      title: 'How was your food?',
      body: `Rate ${order.vendorName} and your rider.`,
      link: `/account/orders/${order.id}`,
    });
    if (rider.isOnline) scheduleJobOffer(rider.id);
    persist();
    return ok({
      id: delivery.id,
      status: 'delivered',
      earning: delivery.riderEarning,
      orderCode: order.code,
    });
  }),

  // ── History and money ──────────────────────────────────────────────────────
  http.get(api('/rider/trips'), async ({ request }) => {
    await latency();
    const { rider, error } = ownRider(request, { approved: true });
    if (error) return error;
    const orders = new Map(db.orders.map((o) => [o.id, o]));
    const rows = db.deliveries
      .filter((d) => d.riderId === rider.id && d.status === 'delivered')
      .map((d) => {
        const o = orders.get(d.orderId);
        return {
          id: d.id,
          orderId: d.orderId,
          orderCode: o?.code ?? '',
          vendorName: o?.vendorName ?? d.pickup.name,
          dropoffArea: o?.address.area ?? '',
          distanceM: d.distanceM,
          fee: d.fee,
          earning: d.riderEarning,
          deliveredAt: d.deliveredAt,
        };
      });
    return listResponse(
      applyListQuery(rows, new URL(request.url).searchParams, {
        searchFields: ['orderCode', 'vendorName', 'dropoffArea'],
        dateField: 'deliveredAt',
        defaultSort: '-deliveredAt',
      }),
    );
  }),

  // BR-PAY-06: earnings = payout % of delivery fees on completed deliveries
  http.get(api('/rider/earnings'), async ({ request }) => {
    await latency();
    const { rider, error } = ownRider(request, { approved: true });
    if (error) return error;
    const now = new Date().toISOString();
    const month = monthOf(now);
    const today = now.slice(0, 10);
    const done = db.deliveries.filter(
      (d) => d.riderId === rider.id && d.status === 'delivered' && d.deliveredAt,
    );
    const thisMonth = done.filter((d) => monthOf(d.deliveredAt) === month);
    const todays = done.filter((d) => d.deliveredAt.slice(0, 10) === today);
    const sum = (list, k) => list.reduce((s, d) => s + d[k], 0);
    return ok({
      month,
      payoutPct: db.settings.riderPayoutPct,
      trips: thisMonth.length,
      deliveryFees: sum(thisMonth, 'fee'),
      earnings: sum(thisMonth, 'riderEarning'),
      today: { trips: todays.length, earnings: sum(todays, 'riderEarning') },
    });
  }),

  http.get(api('/rider/statements'), async ({ request }) => {
    await latency();
    const { rider, error } = ownRider(request, { approved: true });
    if (error) return error;
    return ok(
      db.payoutStatements
        .filter((s) => s.riderId === rider.id)
        .sort((a, b) => b.month.localeCompare(a.month)),
    );
  }),
];
