import { useNewOrderAlerts } from '../../hooks/useVendorOrders';

/** Mount once in the vendor layout: new-order sound and toast on every page. */
export function NewOrderAlerts() {
  useNewOrderAlerts();
  return null;
}
