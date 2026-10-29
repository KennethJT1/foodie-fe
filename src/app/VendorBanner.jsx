import { NewOrderAlerts } from '@/features/orders';
import { SubscriptionBanner } from '@/features/subscriptions';

/** Above every vendor page: plan warnings, plus new-order sound and toasts. */
export function VendorBanner() {
  return (
    <>
      <NewOrderAlerts />
      <SubscriptionBanner />
    </>
  );
}
