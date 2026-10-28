import { LiveTrackingMap } from './LiveTrackingMap';
import { useOrderLive } from '../hooks/useOrderLive';

/** Keeps an active order live over the socket and shows it on the map. */
export function LiveOrderTracker({ order }) {
  useOrderLive(order.id, { enabled: order.isActive });
  if (!order.isActive) return null;
  return <LiveTrackingMap order={order} />;
}
