import { ACTIVE_ORDER_STATUSES } from '@/constants/order-status';

/** Applies an `order:status` socket event to a cached order. */
export function applyStatusEvent(order, event) {
  if (!order || order.id !== event.orderId) return order;
  return {
    ...order,
    status: event.status,
    statusHistory: event.statusHistory ?? order.statusHistory,
    updatedAt: event.updatedAt ?? order.updatedAt,
    isActive: ACTIVE_ORDER_STATUSES.includes(event.status),
    rider: event.rider ? { ...order.rider, ...event.rider } : order.rider,
    riderId: event.rider?.id ?? order.riderId,
    delivery: event.delivery ?? order.delivery,
  };
}

/** Applies a `rider:location` socket event: moves the rider and extends the route trail. */
export function applyLocationEvent(order, event) {
  if (!order || order.id !== event.orderId) return order;
  const point = { lat: event.lat, lng: event.lng };
  return {
    ...order,
    etaMins: event.etaMins ?? order.etaMins,
    rider: { ...(order.rider ?? { id: event.riderId }), ...point, heading: event.heading },
    delivery: order.delivery
      ? { ...order.delivery, route: [...(order.delivery.route ?? []), point] }
      : order.delivery,
  };
}
