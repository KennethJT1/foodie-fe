import { ACTIVE_ORDER_STATUSES, ORDER_STATUS } from '@/constants/order-status';
import { PERMISSIONS } from '@/constants/permissions';
import { isOpenAt } from '@/lib/opening-hours';

import { db, findById } from '../db';
import { notify, permissionsFor } from './auth';
import { isVendorOpen, isVendorVisible } from './catalogue';
import { distanceMetres } from './geo';
import { serverEmit } from '../socket';
import { deliveryFeeFor, processingFeeFor } from './settings-defaults';
import { newId, orderCode } from '../seed/seed';

/** Orders a user may see: own (customer), own store (vendor), own trips (rider), all (admin). */
export function canSeeOrder(user, order) {
  if (!user || !order) return false;
  if (user.role === 'customer') return order.customerId === user.id;
  if (user.role === 'vendor') return order.vendorId === user.vendorId;
  if (user.role === 'rider') return order.riderId === user.riderId;
  if (user.role === 'admin') return permissionsFor(user).includes(PERMISSIONS.ORDERS_VIEW);
  return false;
}

export const ordersFor = (user) => db.orders.filter((o) => canSeeOrder(user, o));

const photoMap = () => new Map(db.foodItems.map((f) => [f.id, f.photos?.[0] ?? null]));

/** Order as the API returns it. Item photos are joined from the food items. */
export function serializeOrder(order, viewer, { photos = photoMap(), detail = false } = {}) {
  const out = {
    ...order,
    items: order.items.map((l) => ({ ...l, photo: photos.get(l.foodItemId) ?? null })),
    itemCount: order.items.reduce((n, l) => n + l.quantity, 0),
    isActive: ACTIVE_ORDER_STATUSES.includes(order.status),
    riderName: order.riderId ? (findById('riders', order.riderId)?.name ?? null) : null,
  };
  // The rider asks the customer for the code, so only the customer (and admins) see it
  if (!['customer', 'admin'].includes(viewer?.role)) delete out.deliveryCode;
  if (!detail) return out;

  const vendor = findById('vendors', order.vendorId);
  const rider = order.riderId ? findById('riders', order.riderId) : null;
  const delivery = db.deliveries.find((d) => d.orderId === order.id) ?? null;
  const refund = db.refunds.find((r) => r.orderId === order.id) ?? null;
  const payment = db.payments.find((p) => p.orderId === order.id) ?? null;
  return {
    ...out,
    vendor: vendor && {
      id: vendor.id,
      name: vendor.name,
      slug: vendor.slug,
      logo: vendor.logo,
      phone: vendor.phone,
      lat: vendor.lat,
      lng: vendor.lng,
      address: vendor.address,
    },
    rider: rider && {
      id: rider.id,
      name: rider.name,
      phone: rider.phone,
      vehicleType: rider.vehicleType,
      plateNumber: rider.plateNumber,
      rating: rider.rating,
      lat: rider.lat,
      lng: rider.lng,
    },
    delivery: delivery && {
      id: delivery.id,
      status: delivery.status,
      pickup: delivery.pickup,
      dropoff: delivery.dropoff,
      route: delivery.route ?? [],
    },
    payment: payment && {
      reference: payment.reference,
      channel: payment.channel,
      status: payment.status,
      amount: payment.amount,
      createdAt: payment.createdAt,
    },
    refund: refund && { id: refund.id, status: refund.status, amount: refund.amount },
  };
}

const err = (status, message, extra = {}) => ({ error: { status, message, ...extra } });

/**
 * Prices a cart on the "server" (never trust client prices).
 * input: { vendorId, items: [{ foodItemId, quantity, optionIds }], addressId | address, scheduledFor }
 */
export function priceCart(user, input = {}) {
  const vendor = findById('vendors', input.vendorId);
  if (!isVendorVisible(vendor)) return err(404, "This store isn't available right now.");
  if (vendor.isPaused)
    return err(422, `${vendor.name} isn't taking orders right now.`, { code: 'VENDOR_PAUSED' });
  if (!Array.isArray(input.items) || input.items.length === 0)
    return err(422, 'Your cart is empty.', { code: 'EMPTY_CART' });

  const address = input.addressId
    ? db.addresses.find((a) => a.id === input.addressId && a.userId === user.id)
    : input.address;
  if (!address || !Number.isFinite(Number(address.lat)) || !Number.isFinite(Number(address.lng)))
    return err(422, 'Pick a delivery address.', {
      fieldErrors: { address: 'Pick a delivery address' },
    });

  const lines = [];
  for (const raw of input.items) {
    const item = findById('foodItems', raw.foodItemId);
    if (!item || item.isHidden || item.vendorId !== vendor.id)
      return err(422, 'Something in your cart is no longer on the menu. Remove it and try again.', {
        code: 'ITEM_UNAVAILABLE',
      });
    if (!item.isAvailable)
      return err(422, `${item.name} is sold out. Remove it to continue.`, {
        code: 'ITEM_UNAVAILABLE',
      });
    const quantity = Math.max(1, Math.min(50, Math.round(Number(raw.quantity) || 1)));
    const optionIds = raw.optionIds ?? [];
    const options = [];
    for (const g of item.optionGroups) {
      const picked = g.options.filter((o) => optionIds.includes(o.id));
      if (g.required && picked.length === 0)
        return err(422, `Choose ${g.name.toLowerCase()} for ${item.name}.`);
      if (g.max && picked.length > g.max)
        return err(422, `Choose up to ${g.max} for ${g.name.toLowerCase()}.`);
      picked.forEach((o) =>
        options.push({
          groupId: g.id,
          groupName: g.name,
          optionId: o.id,
          name: o.name,
          price: o.price,
        }),
      );
    }
    const unit = item.price + options.reduce((s, o) => s + o.price, 0);
    lines.push({
      foodItemId: item.id,
      name: item.name,
      photo: item.photos?.[0] ?? null,
      unitPrice: item.price,
      quantity,
      options,
      lineTotal: unit * quantity,
    });
  }

  const now = new Date();
  let scheduledFor = null;
  if (input.scheduledFor) {
    const at = new Date(input.scheduledFor);
    if (Number.isNaN(at.getTime()) || at.getTime() < now.getTime() + 25 * 60000)
      return err(422, 'Pick a time at least 30 minutes from now.', {
        fieldErrors: { scheduledFor: 'Pick a time at least 30 minutes from now' },
      });
    if (at.getTime() > now.getTime() + 7 * 24 * 3600000)
      return err(422, 'You can schedule up to 7 days ahead.', {
        fieldErrors: { scheduledFor: 'Pick a time within the next 7 days' },
      });
    if (!isOpenAt(vendor.openingHours, at))
      return err(422, `${vendor.name} is closed at that time. Pick another time.`, {
        fieldErrors: { scheduledFor: `${vendor.name} is closed at that time` },
      });
    scheduledFor = at.toISOString();
  }
  const isOpen = isVendorOpen(vendor, now);
  if (!isOpen && !scheduledFor)
    return err(422, `${vendor.name} is closed right now. Pick a delivery time for later.`, {
      code: 'VENDOR_CLOSED',
    });

  const distanceM = Math.max(300, distanceMetres(vendor, address));
  if (distanceM > vendor.deliveryRadiusKm * 1000)
    return err(
      422,
      `${vendor.name} delivers up to ${vendor.deliveryRadiusKm} km away. Pick a closer address.`,
      { code: 'OUT_OF_RANGE' },
    );

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const deliveryFee = deliveryFeeFor(distanceM, db.settings);
  const processingFee = processingFeeFor(subtotal + deliveryFee, db.settings);
  return {
    quote: {
      vendor: { id: vendor.id, name: vendor.name, slug: vendor.slug, logo: vendor.logo },
      lines,
      subtotal,
      deliveryFee,
      processingFee,
      total: subtotal + deliveryFee + processingFee,
      distanceM,
      etaMins: [
        Math.round(vendor.prepTimeMins + distanceM / 400),
        Math.round(vendor.prepTimeMins + distanceM / 300 + 10),
      ],
      isOpen,
      scheduledFor,
      address: {
        label: address.label ?? 'Delivery',
        line1: address.line1,
        area: address.area,
        city: address.city,
        state: address.state,
        lat: Number(address.lat),
        lng: Number(address.lng),
      },
    },
  };
}

/** Creates the order once the gateway confirms payment (FR-ORD-03). */
export function createOrderFromPayment(user, pending) {
  const { quote, deliveryNote } = pending;
  const vendor = findById('vendors', quote.vendor.id);
  const now = new Date();
  const order = {
    id: newId('ord'),
    code: orderCode(),
    customerId: user.id,
    customerName: user.name,
    customerPhone: user.phone,
    vendorId: vendor.id,
    vendorName: vendor.name,
    vendorSlug: vendor.slug,
    riderId: null,
    status: ORDER_STATUS.PAID,
    // eslint-disable-next-line no-unused-vars
    items: quote.lines.map(({ photo, ...l }) => l),
    subtotal: quote.subtotal,
    deliveryFee: quote.deliveryFee,
    processingFee: quote.processingFee,
    total: quote.total,
    address: quote.address,
    deliveryNote: deliveryNote ?? '',
    scheduledFor: quote.scheduledFor,
    deliveryCode: String(Math.floor(1000 + Math.random() * 9000)),
    distanceM: quote.distanceM,
    etaMins: quote.etaMins,
    acceptDeadline: new Date(
      now.getTime() + db.settings.vendorAcceptTimeoutSec * 1000,
    ).toISOString(),
    statusHistory: [{ status: ORDER_STATUS.PAID, at: now.toISOString(), by: 'system' }],
    cancelReason: null,
    ratedVendor: false,
    ratedRider: false,
    paymentReference: pending.reference,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  db.orders.unshift(order);
  db.payments.unshift({
    id: newId('pay'),
    reference: pending.reference,
    type: 'order',
    orderId: order.id,
    vendorId: vendor.id,
    customerId: user.id,
    amount: order.total,
    vendorShare: order.subtotal,
    platformShare: order.deliveryFee,
    fee: order.processingFee,
    channel: pending.channel ?? 'card',
    status: 'success',
    settlementStatus: 'settling',
    settledAt: null,
    reconciled: false,
    flag: null,
    createdAt: now.toISOString(),
  });
  for (const l of order.items) {
    const f = findById('foodItems', l.foodItemId);
    if (f) f.ordersCount += l.quantity;
  }
  notify(user.id, {
    type: 'order',
    title: 'We got your order 🎉',
    body: `Order KJT-${order.code} is with ${vendor.name}.`,
    link: `/account/orders/${order.id}`,
  });
  serverEmit('vendor:order:new', {
    vendorId: vendor.id,
    orderId: order.id,
    code: order.code,
    total: order.subtotal,
    acceptDeadline: order.acceptDeadline,
  });
  notify(vendor.ownerId, {
    type: 'order',
    title: 'New order',
    body: `Order KJT-${order.code} is waiting. Accept it within ${Math.round(db.settings.vendorAcceptTimeoutSec / 60)} min.`,
    link: `/vendor/orders/${order.id}`,
  });
  return order;
}

/**
 * BR-PAY-04: an order the vendor did not accept in time is rejected and refunded in full.
 * Checked lazily whenever the vendor's orders are read.
 */
export function expireOverdueOrders(vendorId, now = Date.now()) {
  let changed = false;
  for (const order of db.orders) {
    if (order.vendorId !== vendorId || order.status !== ORDER_STATUS.PAID) continue;
    if (new Date(order.acceptDeadline).getTime() > now) continue;
    rejectOrder(order, 'Not accepted in time', 'system');
    changed = true;
  }
  return changed;
}

/** Rejects an order and refunds the customer: food from the vendor, delivery fee from us. */
export function rejectOrder(order, reason, by = 'vendor') {
  const at = new Date().toISOString();
  order.status = ORDER_STATUS.REJECTED;
  order.cancelReason = reason;
  order.statusHistory.push({ status: ORDER_STATUS.REJECTED, at, by, note: reason });
  order.updatedAt = at;
  const payment = db.payments.find((p) => p.orderId === order.id);
  if (payment) {
    payment.status = 'refunded';
    payment.refundedAt = at;
  }
  notify(order.customerId, {
    type: 'order',
    title: "The vendor couldn't take your order",
    body: `Order KJT-${order.code}: ${reason}. You'll get a full refund.`,
    link: `/account/orders/${order.id}`,
  });
  serverEmit('order:status', {
    orderId: order.id,
    status: order.status,
    statusHistory: order.statusHistory,
    updatedAt: at,
  });
}

/** Demo traffic: a random customer nearby orders one to three dishes from the vendor. */
export function createDemoOrder(vendor) {
  const items = db.foodItems.filter(
    (f) => f.vendorId === vendor.id && f.isAvailable && !f.isHidden,
  );
  const customers = db.users.filter((u) => u.role === 'customer' && u.status === 'active');
  if (!items.length || !customers.length || vendor.lat == null) return null;
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const customer = pick(customers);
  const chosen = [
    ...new Set(Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () => pick(items))),
  ];
  const lines = chosen.map((item) => {
    const options = item.optionGroups
      .filter((g) => g.required && g.options.length)
      .map((g) => ({
        groupId: g.id,
        groupName: g.name,
        optionId: g.options[0].id,
        name: g.options[0].name,
        price: g.options[0].price,
      }));
    const quantity = 1 + Math.floor(Math.random() * 2);
    const unit = item.price + options.reduce((s, o) => s + o.price, 0);
    return {
      foodItemId: item.id,
      name: item.name,
      unitPrice: item.price,
      quantity,
      options,
      lineTotal: unit * quantity,
    };
  });
  const address = {
    label: 'Home',
    line1: `${10 + Math.floor(Math.random() * 80)} Demo Close`,
    area: vendor.address?.area ?? '',
    city: vendor.city,
    state: vendor.address?.state ?? '',
    lat: vendor.lat + (Math.random() - 0.5) * 0.03,
    lng: vendor.lng + (Math.random() - 0.5) * 0.03,
  };
  const distanceM = Math.max(300, distanceMetres(vendor, address));
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const deliveryFee = deliveryFeeFor(distanceM, db.settings);
  const processingFee = processingFeeFor(subtotal + deliveryFee, db.settings);
  const quote = {
    vendor: { id: vendor.id },
    lines,
    subtotal,
    deliveryFee,
    processingFee,
    total: subtotal + deliveryFee + processingFee,
    distanceM,
    etaMins: [
      Math.round(vendor.prepTimeMins + distanceM / 400),
      Math.round(vendor.prepTimeMins + distanceM / 300 + 10),
    ],
    scheduledFor: null,
    address,
  };
  const reference = `KJT_DEMO${Date.now().toString(36).toUpperCase()}`;
  return createOrderFromPayment(customer, { quote, deliveryNote: '', reference });
}
