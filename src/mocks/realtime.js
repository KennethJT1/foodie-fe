import { getOrderStatusMeta, ORDER_STATUS } from '@/constants/order-status';

import { db, findById, persist } from './db';
import { newId } from './seed/seed';
import { onClientEmit, serverEmit } from './socket';
import { notify } from './utils/auth';
import { distanceMetres, interpolateRoute } from './utils/geo';

/**
 * Fake real-time backend. When the app subscribes to an active order (`order:subscribe`), a
 * rider is moved along a route and the status advances every few seconds until delivered,
 * emitting `order:status` and `rider:location` like the real Socket.IO server.
 * Off by default under tests; tests turn it on with a tiny step.
 */
const isTest = import.meta.env.MODE === 'test';
const options = { enabled: !isTest, stepMs: 5000, approachSteps: 6, deliverySteps: 10 };
const running = new Map(); // orderId -> { timer, subscribers, route, index }
let registered = false;

export function configureOrderSimulation(next) {
  Object.assign(options, next);
}

export function stopOrderSimulations() {
  running.forEach((s) => clearInterval(s.timer));
  running.clear();
}

/** Listens for subscriptions from the app. Safe to call more than once. */
export function registerRealtime() {
  if (registered) return;
  registered = true;
  onClientEmit('order:subscribe', (payload) => subscribe(payload?.orderId));
  onClientEmit('order:unsubscribe', (payload) => unsubscribe(payload?.orderId));
}

const ADVANCE = {
  [ORDER_STATUS.PAID]: ORDER_STATUS.ACCEPTED,
  [ORDER_STATUS.ACCEPTED]: ORDER_STATUS.PREPARING,
  [ORDER_STATUS.PREPARING]: ORDER_STATUS.READY_FOR_PICKUP,
  [ORDER_STATUS.READY_FOR_PICKUP]: ORDER_STATUS.RIDER_ASSIGNED,
};

function subscribe(orderId) {
  if (!options.enabled || !orderId) return;
  const existing = running.get(orderId);
  if (existing) {
    existing.subscribers += 1;
    return;
  }
  const order = findById('orders', orderId);
  if (!order || !(order.status in ADVANCE || isMoving(order.status))) return;
  const state = { subscribers: 1, route: null, index: 0, timer: null };
  state.timer = setInterval(() => step(orderId, state), options.stepMs);
  running.set(orderId, state);
}

function unsubscribe(orderId) {
  const state = running.get(orderId);
  if (!state) return;
  state.subscribers -= 1;
  if (state.subscribers <= 0) stop(orderId);
}

function stop(orderId) {
  const state = running.get(orderId);
  if (state) clearInterval(state.timer);
  running.delete(orderId);
}

const isMoving = (s) => s === ORDER_STATUS.RIDER_ASSIGNED || s === ORDER_STATUS.PICKED_UP;

function riderSummary(rider) {
  return {
    id: rider.id,
    name: rider.name,
    phone: rider.phone,
    vehicleType: rider.vehicleType,
    plateNumber: rider.plateNumber,
    rating: rider.rating,
    lat: rider.lat,
    lng: rider.lng,
  };
}

function ensureRider(order, vendor) {
  let rider = order.riderId ? findById('riders', order.riderId) : null;
  if (!rider) {
    rider =
      db.riders
        .filter((r) => r.approvalStatus === 'approved' && r.city === vendor.city)
        .sort((a, b) => distanceMetres(a, vendor) - distanceMetres(b, vendor))[0] ??
      db.riders.find((r) => r.approvalStatus === 'approved');
    order.riderId = rider.id;
    // Start the rider a short ride away from the vendor
    rider.lat = vendor.lat + 0.012;
    rider.lng = vendor.lng - 0.009;
  }
  let delivery = db.deliveries.find((d) => d.orderId === order.id);
  if (!delivery) {
    delivery = {
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
  }
  return { rider, delivery };
}

function setStatus(order, status, extra = {}) {
  const at = new Date().toISOString();
  order.status = status;
  order.statusHistory.push({
    status,
    at,
    by: [ORDER_STATUS.RIDER_ASSIGNED, ORDER_STATUS.PICKED_UP, ORDER_STATUS.DELIVERED].includes(
      status,
    )
      ? 'rider'
      : 'vendor',
  });
  order.updatedAt = at;
  notify(order.customerId, {
    type: 'order',
    title: getOrderStatusMeta(status).customer,
    body: `Order KJT-${order.code}`,
    link: `/account/orders/${order.id}`,
  });
  persist();
  serverEmit('order:status', {
    orderId: order.id,
    status,
    statusHistory: order.statusHistory,
    updatedAt: at,
    ...extra,
  });
}

function etaFor(point, target) {
  const mins = Math.max(1, Math.round(distanceMetres(point, target) / 300));
  return [mins, mins + 5];
}

function moveRider(order, rider, delivery, state, target) {
  state.index = Math.min(state.index + 1, state.route.length - 1);
  const prev = { lat: rider.lat, lng: rider.lng };
  const point = state.route[state.index];
  rider.lat = point.lat;
  rider.lng = point.lng;
  rider.lastSeenAt = new Date().toISOString();
  delivery.route.push({ ...point, at: rider.lastSeenAt }); // FR-GPS-05 route history
  const heading = (Math.atan2(point.lng - prev.lng, point.lat - prev.lat) * 180) / Math.PI;
  const etaMins = etaFor(point, target);
  order.etaMins = etaMins;
  serverEmit('rider:location', {
    orderId: order.id,
    riderId: rider.id,
    lat: point.lat,
    lng: point.lng,
    heading: Math.round(heading),
    etaMins,
    at: rider.lastSeenAt,
  });
  return state.index >= state.route.length - 1;
}

function step(orderId, state) {
  const order = findById('orders', orderId);
  if (!order) return stop(orderId);
  const vendor = findById('vendors', order.vendorId);
  const next = ADVANCE[order.status];

  if (next === ORDER_STATUS.RIDER_ASSIGNED) {
    const { rider, delivery } = ensureRider(order, vendor);
    state.route = null;
    return setStatus(order, next, {
      rider: riderSummary(rider),
      delivery: publicDelivery(delivery),
    });
  }
  if (next) return setStatus(order, next);

  if (order.status === ORDER_STATUS.RIDER_ASSIGNED) {
    const { rider, delivery } = ensureRider(order, vendor);
    if (!state.route) {
      state.route = interpolateRoute(rider, vendor, options.approachSteps);
      state.index = 0;
    }
    if (moveRider(order, rider, delivery, state, order.address)) {
      delivery.status = 'picked_up';
      delivery.pickedUpAt = new Date().toISOString();
      state.route = null;
      setStatus(order, ORDER_STATUS.PICKED_UP, { rider: riderSummary(rider) });
    }
    return persist();
  }

  if (order.status === ORDER_STATUS.PICKED_UP) {
    const { rider, delivery } = ensureRider(order, vendor);
    if (!state.route) {
      state.route = interpolateRoute(vendor, order.address, options.deliverySteps);
      state.index = 0;
    }
    if (moveRider(order, rider, delivery, state, order.address)) {
      const now = new Date().toISOString();
      delivery.status = 'delivered';
      delivery.deliveredAt = now;
      delivery.riderEarning = Math.round((order.deliveryFee * delivery.payoutPct) / 100);
      rider.tripsCount += 1;
      setStatus(order, ORDER_STATUS.DELIVERED, { rider: riderSummary(rider) });
      notify(order.customerId, {
        type: 'order',
        title: 'How was your food?',
        body: `Rate ${order.vendorName} and your rider.`,
        link: `/account/orders/${order.id}`,
      });
      persist();
      return stop(orderId);
    }
    return persist();
  }

  return stop(orderId);
}

const publicDelivery = (d) => ({
  id: d.id,
  status: d.status,
  pickup: d.pickup,
  dropoff: d.dropoff,
  route: d.route,
});
