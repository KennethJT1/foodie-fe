import { getOrderStatusMeta, ORDER_STATUS } from '@/constants/order-status';

import { db, findById, persist } from './db';
import { newId } from './seed/seed';
import { onClientEmit, serverEmit } from './socket';
import { notify } from './utils/auth';
import { distanceMetres, interpolateRoute } from './utils/geo';
import { createDemoOrder } from './utils/orders';

/**
 * Fake real-time backend. When the app subscribes to an active order (`order:subscribe`), a
 * rider is moved along a route and the status advances every few seconds until delivered,
 * emitting `order:status` and `rider:location` like the real Socket.IO server.
 * While a vendor's dashboard is open (`vendor:subscribe`) the vendor accepts and prepares their
 * own orders, and new demo orders arrive every `newOrderMs` (`vendor:order:new`).
 * Off by default under tests; tests turn it on with a tiny step.
 */
const isTest = import.meta.env.MODE === 'test';
const options = {
  enabled: !isTest,
  stepMs: 5000,
  approachSteps: 6,
  deliverySteps: 10,
  newOrderMs: isTest ? 0 : 60000,
  offerDelayMs: isTest ? 0 : 4000,
  chatReplyMs: isTest ? 0 : 3000,
};
const running = new Map(); // orderId -> { timer, subscribers, route, index }
const vendorWatchers = new Map(); // vendorId -> { count, timer }
const riderWatchers = new Map(); // riderId -> count
const offerTimers = new Map(); // riderId -> timeout
let liveMap = { count: 0, timer: null };
let registered = false;

export function configureOrderSimulation(next) {
  Object.assign(options, next);
}

export function stopOrderSimulations() {
  running.forEach((s) => clearInterval(s.timer));
  running.clear();
  vendorWatchers.forEach((w) => clearInterval(w.timer));
  vendorWatchers.clear();
  riderWatchers.clear();
  offerTimers.forEach((t) => clearTimeout(t));
  offerTimers.clear();
  clearInterval(liveMap.timer);
  liveMap = { count: 0, timer: null };
}

/** Listens for subscriptions from the app. Safe to call more than once. */
export function registerRealtime() {
  if (registered) return;
  registered = true;
  onClientEmit('order:subscribe', (payload) => subscribe(payload?.orderId));
  onClientEmit('order:unsubscribe', (payload) => unsubscribe(payload?.orderId));
  onClientEmit('vendor:subscribe', (payload) => watchVendor(payload?.vendorId));
  onClientEmit('vendor:unsubscribe', (payload) => unwatchVendor(payload?.vendorId));
  onClientEmit('rider:subscribe', ({ riderId } = {}) => {
    if (riderId) riderWatchers.set(riderId, (riderWatchers.get(riderId) ?? 0) + 1);
  });
  onClientEmit('rider:unsubscribe', ({ riderId } = {}) => {
    const n = (riderWatchers.get(riderId) ?? 1) - 1;
    if (n <= 0) riderWatchers.delete(riderId);
    else riderWatchers.set(riderId, n);
  });
  onClientEmit('rider:location', (payload) => receiveRiderLocation(payload));
  onClientEmit('admin:live-map:subscribe', () => {
    liveMap.count += 1;
    if (!liveMap.timer && options.enabled)
      liveMap.timer = setInterval(() => {
        driftIdleRiders();
        serverEmit('admin:live-map', liveMapSnapshot());
      }, options.stepMs);
  });
  onClientEmit('admin:live-map:unsubscribe', () => {
    liveMap.count = Math.max(0, liveMap.count - 1);
    if (!liveMap.count) {
      clearInterval(liveMap.timer);
      liveMap.timer = null;
    }
  });
}

/** Online riders and active deliveries for the admin live map (FR-GPS-04). */
export function liveMapSnapshot() {
  const active = db.orders.filter((o) =>
    [ORDER_STATUS.READY_FOR_PICKUP, ORDER_STATUS.RIDER_ASSIGNED, ORDER_STATUS.PICKED_UP].includes(
      o.status,
    ),
  );
  const busy = new Map(active.filter((o) => o.riderId).map((o) => [o.riderId, o]));
  return {
    riders: db.riders
      .filter((r) => r.isOnline && r.lat != null)
      .map((r) => ({
        id: r.id,
        name: r.name,
        city: r.city,
        vehicleType: r.vehicleType,
        lat: r.lat,
        lng: r.lng,
        lastSeenAt: r.lastSeenAt ?? null,
        orderId: busy.get(r.id)?.id ?? null,
      })),
    deliveries: active.map((o) => {
      const v = findById('vendors', o.vendorId);
      return {
        orderId: o.id,
        code: o.code,
        status: o.status,
        city: v?.city ?? o.address.city,
        riderId: o.riderId,
        vendor: { name: o.vendorName, lat: v?.lat, lng: v?.lng },
        dropoff: { area: o.address.area, lat: o.address.lat, lng: o.address.lng },
        etaMins: o.etaMins,
      };
    }),
    at: new Date().toISOString(),
  };
}

/** Idle online riders wander a little so the demo map looks alive. */
function driftIdleRiders() {
  for (const r of db.riders) {
    if (!r.isOnline || r.lat == null || hasActiveDelivery(r.id)) continue;
    r.lat += (Math.random() - 0.5) * 0.002;
    r.lng += (Math.random() - 0.5) * 0.002;
    r.lastSeenAt = new Date().toISOString();
  }
}

/** A rider's phone reports where they are; customers watching their order see it move. */
function receiveRiderLocation({ riderId, lat, lng, heading } = {}) {
  const rider = riderId && findById('riders', riderId);
  if (!rider || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
  Object.assign(rider, { lat, lng, lastSeenAt: new Date().toISOString() });
  const order = db.orders.find((o) => o.riderId === rider.id && isMoving(o.status));
  if (order) {
    const target =
      order.status === ORDER_STATUS.PICKED_UP ? order.address : findById('vendors', order.vendorId);
    const etaMins = etaFor({ lat, lng }, target);
    order.etaMins = etaMins;
    db.deliveries
      .find((d) => d.orderId === order.id)
      ?.route.push({ lat, lng, at: rider.lastSeenAt });
    serverEmit('rider:location', {
      orderId: order.id,
      riderId,
      lat,
      lng,
      heading,
      etaMins,
      at: rider.lastSeenAt,
    });
  }
  persist();
}

const hasActiveDelivery = (riderId) =>
  db.orders.some((o) => o.riderId === riderId && isMoving(o.status));

/** A ready order near the rider, or a fresh demo order from a nearby vendor (marked ready). */
function orderForOffer(rider) {
  const offered = new Set(
    (db.jobOffers ?? []).filter((o) => o.status === 'pending').map((o) => o.orderId),
  );
  const ready = db.orders
    .filter((o) => o.status === ORDER_STATUS.READY_FOR_PICKUP && !o.riderId && !offered.has(o.id))
    .map((o) => ({ o, v: findById('vendors', o.vendorId) }))
    .filter(({ v }) => v?.city === rider.city)
    .sort((a, b) => distanceMetres(a.v, rider) - distanceMetres(b.v, rider))[0]?.o;
  if (ready) return ready;
  const vendor = db.vendors
    .filter((v) => v.approvalStatus === 'approved' && v.city === rider.city && !v.isPaused)
    .sort((a, b) => distanceMetres(a, rider) - distanceMetres(b, rider))[0];
  const order = vendor && createDemoOrder(vendor);
  if (!order) return null;
  const at = new Date().toISOString();
  for (const status of [
    ORDER_STATUS.ACCEPTED,
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.READY_FOR_PICKUP,
  ])
    order.statusHistory.push({ status, at, by: 'vendor' });
  order.status = ORDER_STATUS.READY_FOR_PICKUP;
  return order;
}

/** Sends the rider a 30-second job offer (`rider:job:offer`). Returns the offer or null. */
export function createJobOffer(riderId) {
  const rider = findById('riders', riderId);
  if (!rider?.isOnline || hasActiveDelivery(riderId)) return null;
  if (
    (db.jobOffers ?? []).some(
      (o) =>
        o.riderId === riderId && o.status === 'pending' && o.expiresAt > new Date().toISOString(),
    )
  )
    return null;
  const order = orderForOffer(rider);
  if (!order) return null;
  const vendor = findById('vendors', order.vendorId);
  const now = Date.now();
  const offer = {
    id: newId('off'),
    orderId: order.id,
    orderCode: order.code,
    riderId,
    status: 'pending',
    fee: order.deliveryFee,
    earning: Math.round((order.deliveryFee * db.settings.riderPayoutPct) / 100),
    distanceM: order.distanceM,
    toPickupM: rider.lat == null ? null : distanceMetres(rider, vendor),
    pickup: {
      name: vendor.name,
      area: vendor.address?.area ?? '',
      lat: vendor.lat,
      lng: vendor.lng,
    },
    dropoff: {
      area: order.address.area,
      city: order.address.city,
      lat: order.address.lat,
      lng: order.address.lng,
    },
    expiresAt: new Date(now + db.settings.riderOfferTimeoutSec * 1000).toISOString(),
    createdAt: new Date(now).toISOString(),
  };
  (db.jobOffers ??= []).unshift(offer);
  persist();
  serverEmit('rider:job:offer', offer);
  return offer;
}

/** Queues the next offer for an online rider (after going online, declining or delivering). */
export function scheduleJobOffer(riderId, delayMs = options.offerDelayMs) {
  if (!options.enabled || !delayMs) return;
  clearTimeout(offerTimers.get(riderId));
  offerTimers.set(
    riderId,
    setTimeout(() => {
      offerTimers.delete(riderId);
      createJobOffer(riderId);
    }, delayMs),
  );
}

export function cancelJobOffers(riderId) {
  clearTimeout(offerTimers.get(riderId));
  offerTimers.delete(riderId);
}

function watchVendor(vendorId) {
  if (!vendorId) return;
  const w = vendorWatchers.get(vendorId) ?? { count: 0, timer: null };
  w.count += 1;
  if (!w.timer && options.enabled && options.newOrderMs > 0)
    w.timer = setInterval(() => simulateIncomingOrder(vendorId), options.newOrderMs);
  vendorWatchers.set(vendorId, w);
}

function unwatchVendor(vendorId) {
  const w = vendorWatchers.get(vendorId);
  if (!w) return;
  w.count -= 1;
  if (w.count <= 0) {
    clearInterval(w.timer);
    vendorWatchers.delete(vendorId);
  }
}

/** A customer somewhere places an order with this vendor (demo traffic for the live queue). */
export function simulateIncomingOrder(vendorId) {
  const vendor = findById('vendors', vendorId);
  if (!vendor || vendor.isPaused) return null;
  const order = createDemoOrder(vendor);
  if (order) persist();
  return order;
}

/** Steps the vendor takes themselves while their dashboard is open. */
const VENDOR_STEPS = [ORDER_STATUS.PAID, ORDER_STATUS.ACCEPTED, ORDER_STATUS.PREPARING];

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

export function riderSummary(rider) {
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

/** Moves an order to `status`, tells the customer and emits `order:status`. */
export function updateOrderStatus(order, status, extra = {}, by = null) {
  const at = new Date().toISOString();
  order.status = status;
  order.statusHistory.push({
    status,
    at,
    by:
      by ??
      ([ORDER_STATUS.RIDER_ASSIGNED, ORDER_STATUS.PICKED_UP, ORDER_STATUS.DELIVERED].includes(
        status,
      )
        ? 'rider'
        : 'vendor'),
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
  // The vendor is at their dashboard: wait for them to accept, prepare and mark ready
  if (vendorWatchers.has(order.vendorId) && VENDOR_STEPS.includes(order.status)) return undefined;
  // A rider is using the app: dispatch goes through job offers and the rider moves themselves
  if (order.status === ORDER_STATUS.READY_FOR_PICKUP && riderWatchers.size) return undefined;
  if (isMoving(order.status) && riderWatchers.has(order.riderId)) return undefined;
  const next = ADVANCE[order.status];

  if (next === ORDER_STATUS.RIDER_ASSIGNED) {
    const { rider, delivery } = ensureRider(order, vendor);
    state.route = null;
    return updateOrderStatus(order, next, {
      rider: riderSummary(rider),
      delivery: publicDelivery(delivery),
    });
  }
  if (next) return updateOrderStatus(order, next);

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
      updateOrderStatus(order, ORDER_STATUS.PICKED_UP, { rider: riderSummary(rider) });
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
      updateOrderStatus(order, ORDER_STATUS.DELIVERED, { rider: riderSummary(rider) });
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

export const publicDelivery = (d) => ({
  id: d.id,
  status: d.status,
  pickup: d.pickup,
  dropoff: d.dropoff,
  route: d.route,
});

const CUSTOMER_REPLIES = [
  "Okay, thank you. I'm at home.",
  'Please call when you get to the gate.',
  'No wahala, I will come out.',
];
const RIDER_REPLIES = [
  "I'm on my way.",
  'I will call you when I get there.',
  'Traffic is a bit slow, I will be there soon.',
];

/** Demo: the other side answers a chat message, unless a real rider is using the app. */
export function scheduleChatReply(order, message) {
  if (!options.chatReplyMs) return;
  const fromCustomer = message.senderRole === 'customer';
  if (fromCustomer && riderWatchers.has(order.riderId)) return;
  setTimeout(() => {
    const live = findById('orders', order.id);
    if (!live || ![ORDER_STATUS.RIDER_ASSIGNED, ORDER_STATUS.PICKED_UP].includes(live.status))
      return;
    const rider = findById('riders', live.riderId);
    const customer = findById('users', live.customerId);
    const pool = fromCustomer ? RIDER_REPLIES : CUSTOMER_REPLIES;
    const reply = {
      id: newId('chm'),
      orderId: live.id,
      senderId: fromCustomer ? rider?.userId : customer?.id,
      senderRole: fromCustomer ? 'rider' : 'customer',
      senderName: fromCustomer ? rider?.name : customer?.firstName,
      body: pool[Math.floor(Math.random() * pool.length)],
      createdAt: new Date().toISOString(),
    };
    db.chatMessages.push(reply);
    persist();
    serverEmit('chat:message', reply);
  }, options.chatReplyMs);
}
