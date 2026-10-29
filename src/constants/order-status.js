/** Order lifecycle (BRD section 7). */
export const ORDER_STATUS = Object.freeze({
  PAID: 'paid',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  PREPARING: 'preparing',
  READY_FOR_PICKUP: 'ready_for_pickup',
  RIDER_ASSIGNED: 'rider_assigned',
  PICKED_UP: 'picked_up',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
});

const S = ORDER_STATUS;

/** Label, badge tone and the friendly line shown to customers. */
export const ORDER_STATUS_META = {
  [S.PAID]: { label: 'Paid', tone: 'info', customer: 'Waiting for the vendor to accept' },
  [S.ACCEPTED]: { label: 'Accepted', tone: 'info', customer: 'The vendor has your order' },
  [S.REJECTED]: {
    label: 'Rejected',
    tone: 'danger',
    customer: "The vendor couldn't take this order. You'll be refunded in full.",
  },
  [S.PREPARING]: { label: 'Preparing', tone: 'warning', customer: 'Your food is being prepared' },
  [S.READY_FOR_PICKUP]: {
    label: 'Ready for pickup',
    tone: 'warning',
    customer: 'Ready — finding a rider',
  },
  [S.RIDER_ASSIGNED]: {
    label: 'Rider assigned',
    tone: 'info',
    customer: 'A rider is heading to the vendor',
  },
  [S.PICKED_UP]: { label: 'On the way', tone: 'info', customer: 'Your food is on the way 🚚' },
  [S.DELIVERED]: { label: 'Delivered', tone: 'success', customer: 'Delivered. Enjoy your meal 🎉' },
  [S.CANCELLED]: { label: 'Cancelled', tone: 'neutral', customer: 'This order was cancelled' },
};

/** Happy-path order used by timelines and progress bars. */
export const ORDER_STATUS_FLOW = [
  S.PAID,
  S.ACCEPTED,
  S.PREPARING,
  S.READY_FOR_PICKUP,
  S.RIDER_ASSIGNED,
  S.PICKED_UP,
  S.DELIVERED,
];

export const ACTIVE_ORDER_STATUSES = ORDER_STATUS_FLOW.slice(0, -1);

export const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUS_META).map(([value, m]) => ({
  value,
  label: m.label,
}));

export const getOrderStatusMeta = (status) =>
  ORDER_STATUS_META[status] ?? { label: status, tone: 'neutral', customer: status };
